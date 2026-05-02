import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

import WebSocket, { WebSocketServer, type RawData } from 'ws';

import {
  CLIENT_AUDIO_ONLY_REQUEST,
  COMPRESSION_GZIP,
  EVENT_ASR_INFO,
  EVENT_ASR_RESPONSE,
  EVENT_AUDIO_REQUEST,
  EVENT_CHAT_ENDED,
  EVENT_CHAT_RESPONSE,
  EVENT_CONNECTION_FAILED,
  EVENT_CONNECTION_STARTED,
  EVENT_DIALOG_COMMON_ERROR,
  EVENT_FINISH_CONNECTION,
  EVENT_FINISH_SESSION,
  EVENT_SAY_HELLO,
  EVENT_SESSION_FAILED,
  EVENT_SESSION_STARTED,
  EVENT_START_CONNECTION,
  EVENT_START_SESSION,
  EVENT_TTS_ENDED,
  EVENT_TTS_RESPONSE,
  SERIALIZATION_RAW,
  buildStartSessionPayload,
  encodeEventFrame,
  getRealtimeVoiceConfig,
  parseRealtimePacket,
} from './realtime-tts';

const REALTIME_PATH = '/api/v1/voice/realtime';
const DEFAULT_TIMEOUT_MS = 120_000;

function isOpen(ws?: WebSocket | null) {
  return ws?.readyState === WebSocket.OPEN;
}

function rawDataToBuffer(data: RawData) {
  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (Array.isArray(data)) {
    return Buffer.concat(data);
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  return Buffer.from(data);
}

function sendJson(client: WebSocket, payload: unknown) {
  if (isOpen(client)) {
    client.send(JSON.stringify(payload));
  }
}

function eventName(event?: number) {
  switch (event) {
    case EVENT_ASR_INFO:
      return 'asr_info';
    case EVENT_ASR_RESPONSE:
      return 'asr_response';
    case EVENT_CHAT_RESPONSE:
      return 'chat_response';
    case EVENT_CHAT_ENDED:
      return 'chat_ended';
    case EVENT_TTS_ENDED:
      return 'tts_ended';
    default:
      return 'provider_event';
  }
}

class RealtimeVoiceSession {
  private readonly sessionId = randomUUID();
  private readonly connectId = randomUUID();
  private readonly config = getRealtimeVoiceConfig();
  private readonly timeoutMs = Number(
    process.env.VOICE_REALTIME_SESSION_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  );
  private upstream: WebSocket | null = null;
  private upstreamReady = false;
  private closed = false;
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly client: WebSocket) {
    this.timer = setTimeout(() => {
      this.sendError('realtime_voice_session_timeout');
      this.close();
    }, this.timeoutMs);
  }

  start() {
    if (!this.config.apiKey || !this.config.appId) {
      this.sendError('missing_realtime_voice_config');
      this.close();
      return;
    }

    this.bindClient();
    this.connectUpstream();
  }

  private bindClient() {
    this.client.on('message', (data, isBinary) => {
      if (isBinary) {
        this.sendAudio(rawDataToBuffer(data));
        return;
      }

      this.handleClientText(rawDataToBuffer(data).toString('utf8'));
    });

    this.client.on('close', () => this.close());
    this.client.on('error', () => this.close());
  }

  private connectUpstream() {
    this.upstream = new WebSocket(this.config.baseUrl, {
      headers: {
        'X-Api-App-ID': this.config.appId,
        'X-Api-Access-Key': this.config.apiKey,
        'X-Api-Resource-Id': this.config.resourceId,
        'X-Api-App-Key': this.config.appKey,
        'X-Api-Connect-Id': this.connectId,
      },
    });

    this.upstream.on('open', () => {
      this.upstream?.send(
        encodeEventFrame({
          event: EVENT_START_CONNECTION,
        }),
      );
      sendJson(this.client, { type: 'status', status: 'connecting_provider' });
    });

    this.upstream.on('message', (data) => this.handleUpstreamMessage(data));
    this.upstream.on('error', (error) => {
      this.sendError(
        error instanceof Error ? error.message : 'realtime_provider_error',
      );
      this.close();
    });
    this.upstream.on('close', () => {
      if (!this.closed) {
        this.sendError('realtime_provider_closed');
        this.close();
      }
    });
  }

  private handleClientText(raw: string) {
    let payload: { type?: string; content?: string } | null = null;

    try {
      payload = JSON.parse(raw) as { type?: string; content?: string };
    } catch {
      this.sendError('invalid_client_message');
      return;
    }

    if (payload.type === 'ping') {
      sendJson(this.client, { type: 'pong' });
      return;
    }

    if (payload.type === 'stop') {
      this.close();
      return;
    }

    if (payload.type === 'text' && payload.content?.trim()) {
      this.sendSayHello(payload.content.trim());
    }
  }

  private handleUpstreamMessage(data: RawData) {
    let packet: ReturnType<typeof parseRealtimePacket>;

    try {
      packet = parseRealtimePacket(data);
    } catch (error) {
      this.sendError(
        error instanceof Error
          ? error.message
          : 'invalid_realtime_provider_packet',
      );
      this.close();
      return;
    }

    if (
      packet.event === EVENT_CONNECTION_FAILED ||
      packet.event === EVENT_SESSION_FAILED ||
      packet.event === EVENT_DIALOG_COMMON_ERROR
    ) {
      this.sendError('realtime_provider_failed', packet.payload);
      this.close();
      return;
    }

    if (packet.event === EVENT_CONNECTION_STARTED) {
      this.sendStartSession();
      return;
    }

    if (packet.event === EVENT_SESSION_STARTED) {
      this.upstreamReady = true;
      sendJson(this.client, {
        type: 'ready',
        sessionId: this.sessionId,
        model: this.config.model,
      });
      return;
    }

    if (packet.event === EVENT_TTS_RESPONSE && packet.payloadBuffer?.length) {
      if (isOpen(this.client)) {
        this.client.send(packet.payloadBuffer, { binary: true });
      }
      return;
    }

    if (packet.event) {
      sendJson(this.client, {
        type: 'event',
        event: packet.event,
        name: eventName(packet.event),
        data: packet.payload ?? null,
      });
    }
  }

  private sendStartSession() {
    if (!isOpen(this.upstream)) {
      return;
    }

    this.upstream?.send(
      encodeEventFrame({
        event: EVENT_START_SESSION,
        sessionId: this.sessionId,
        payload: buildStartSessionPayload({
          model: this.config.model,
          voiceType: this.config.voiceType,
          timeoutMs: this.timeoutMs,
          inputMode: 'audio',
        }),
      }),
    );
  }

  private sendAudio(audio: Buffer) {
    if (!this.upstreamReady || !isOpen(this.upstream) || !audio.length) {
      return;
    }

    this.upstream?.send(
      encodeEventFrame({
        event: EVENT_AUDIO_REQUEST,
        sessionId: this.sessionId,
        payload: audio,
        messageType: CLIENT_AUDIO_ONLY_REQUEST,
        serialization: SERIALIZATION_RAW,
        compression: COMPRESSION_GZIP,
      }),
    );
  }

  private sendSayHello(content: string) {
    if (!this.upstreamReady || !isOpen(this.upstream)) {
      return;
    }

    this.upstream?.send(
      encodeEventFrame({
        event: EVENT_SAY_HELLO,
        sessionId: this.sessionId,
        payload: { content },
      }),
    );
  }

  private sendError(message: string, detail?: unknown) {
    sendJson(this.client, {
      type: 'error',
      message,
      detail,
    });
  }

  close() {
    if (this.closed) {
      return;
    }

    this.closed = true;
    clearTimeout(this.timer);

    if (isOpen(this.upstream)) {
      this.upstream?.send(
        encodeEventFrame({
          event: EVENT_FINISH_SESSION,
          sessionId: this.sessionId,
        }),
      );
      this.upstream?.send(
        encodeEventFrame({
          event: EVENT_FINISH_CONNECTION,
        }),
      );
    }

    this.upstreamReady = false;
    this.upstream?.close();
    this.upstream = null;

    if (isOpen(this.client)) {
      this.client.close();
    }
  }
}

export function registerRealtimeVoiceGateway(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(
      request.url ?? '/',
      `http://${request.headers.host ?? 'localhost'}`,
    ).pathname;

    if (pathname !== REALTIME_PATH) {
      return;
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client, request);
    });
  });

  wss.on('connection', (client) => {
    const session = new RealtimeVoiceSession(client);
    session.start();
  });
}
