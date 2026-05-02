import { randomUUID } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';

import WebSocket, { type RawData } from 'ws';

const DEFAULT_REALTIME_URL =
  'wss://openspeech.bytedance.com/api/v3/realtime/dialogue';
const DEFAULT_REALTIME_MODEL = '1.2.1.1';
const DEFAULT_RESOURCE_ID = 'volc.speech.dialog';
const DEFAULT_APP_KEY = 'PlgvMymc7f3tQnJ6';
const DEFAULT_VOICE_TYPE = 'zh_female_vv_jupiter_bigtts';
const PCM_SAMPLE_RATE = 24000;

const CLIENT_FULL_REQUEST = 0b0001;
export const CLIENT_AUDIO_ONLY_REQUEST = 0b0010;
const SERVER_FULL_RESPONSE = 0b1001;
const SERVER_AUDIO_ONLY_RESPONSE = 0b1011;
const SERVER_ERROR_RESPONSE = 0b1111;

const FLAG_WITH_EVENT = 0b0100;
export const SERIALIZATION_RAW = 0b0000;
const SERIALIZATION_JSON = 0b0001;
const COMPRESSION_NONE = 0b0000;
export const COMPRESSION_GZIP = 0b0001;

export const EVENT_START_CONNECTION = 1;
export const EVENT_FINISH_CONNECTION = 2;
export const EVENT_CONNECTION_STARTED = 50;
export const EVENT_CONNECTION_FAILED = 51;
export const EVENT_START_SESSION = 100;
export const EVENT_FINISH_SESSION = 102;
export const EVENT_SESSION_STARTED = 150;
export const EVENT_SESSION_FAILED = 153;
export const EVENT_AUDIO_REQUEST = 200;
export const EVENT_SAY_HELLO = 300;
export const EVENT_TTS_SENTENCE_START = 350;
export const EVENT_TTS_SENTENCE_END = 351;
export const EVENT_TTS_RESPONSE = 352;
export const EVENT_TTS_ENDED = 359;
export const EVENT_ASR_INFO = 450;
export const EVENT_ASR_RESPONSE = 451;
export const EVENT_ASR_ENDED = 459;
export const EVENT_CHAT_TTS_TEXT = 500;
export const EVENT_CHAT_TEXT_QUERY = 501;
export const EVENT_CHAT_RESPONSE = 550;
export const EVENT_CHAT_ENDED = 559;
export const EVENT_DIALOG_COMMON_ERROR = 599;

type RealtimeTtsOptions = {
  text: string;
  apiKey?: string;
  appId?: string;
  appKey?: string;
  baseUrl?: string;
  model?: string;
  voiceType?: string;
  resourceId?: string;
  timeoutMs?: number;
};

type RealtimeTtsResult = {
  audio: Buffer;
  contentType: string;
  model: string;
  voiceType: string;
};

type ParsedRealtimePacket = {
  messageType: number;
  flags: number;
  event?: number;
  code?: number;
  sessionId?: string;
  payload?: unknown;
  payloadBuffer?: Buffer;
};

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

function uint32Buffer(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
}

function createHeader({
  messageType = CLIENT_FULL_REQUEST,
  flags = FLAG_WITH_EVENT,
  serialization = SERIALIZATION_JSON,
  compression = COMPRESSION_GZIP,
}: {
  messageType?: number;
  flags?: number;
  serialization?: number;
  compression?: number;
} = {}) {
  return Buffer.from([
    0x11,
    (messageType << 4) | flags,
    (serialization << 4) | compression,
    0x00,
  ]);
}

export function encodeEventFrame({
  event,
  payload = {},
  sessionId,
  messageType = CLIENT_FULL_REQUEST,
  serialization = SERIALIZATION_JSON,
  compression = COMPRESSION_GZIP,
}: {
  event: number;
  payload?: unknown;
  sessionId?: string;
  messageType?: number;
  serialization?: number;
  compression?: number;
}) {
  const rawPayload = Buffer.isBuffer(payload)
    ? payload
    : Buffer.from(JSON.stringify(payload), 'utf8');
  const payloadBuffer = Buffer.from(
    compression === COMPRESSION_GZIP ? gzipSync(rawPayload) : rawPayload,
  );
  const parts: Buffer[] = [
    createHeader({ messageType, serialization, compression }),
    uint32Buffer(event),
  ];

  if (sessionId) {
    const sessionBuffer = Buffer.from(sessionId, 'utf8');
    parts.push(uint32Buffer(sessionBuffer.length), sessionBuffer);
  }

  parts.push(uint32Buffer(payloadBuffer.length), payloadBuffer);

  return Buffer.concat(parts);
}

function createWavHeader(dataLength: number, sampleRate = PCM_SAMPLE_RATE) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2;
  const blockAlign = 2;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

function readPayload(
  payload: Buffer,
  serialization: number,
  compression: number,
) {
  const body = compression === COMPRESSION_GZIP ? gunzipSync(payload) : payload;

  if (serialization === SERIALIZATION_JSON) {
    return {
      payload: JSON.parse(body.toString('utf8')) as unknown,
      payloadBuffer: body,
    };
  }

  return {
    payload: undefined,
    payloadBuffer: body,
  };
}

function maybeReadSessionId(buffer: Buffer, offset: number) {
  if (offset + 8 > buffer.length) {
    return { sessionId: undefined, offset };
  }

  const sessionSize = buffer.readUInt32BE(offset);
  const payloadSizeOffset = offset + 4 + sessionSize;

  if (
    sessionSize <= 0 ||
    sessionSize > 128 ||
    payloadSizeOffset + 4 > buffer.length
  ) {
    return { sessionId: undefined, offset };
  }

  const payloadSize = buffer.readUInt32BE(payloadSizeOffset);
  const payloadOffset = payloadSizeOffset + 4;

  if (payloadOffset + payloadSize > buffer.length) {
    return { sessionId: undefined, offset };
  }

  return {
    sessionId: buffer.subarray(offset + 4, payloadSizeOffset).toString('utf8'),
    offset: payloadSizeOffset,
  };
}

export function parseRealtimePacket(data: RawData): ParsedRealtimePacket {
  const buffer = rawDataToBuffer(data);

  if (buffer.length < 4) {
    throw new Error('invalid_realtime_voice_packet');
  }

  const headerSize = (buffer.readUInt8(0) & 0x0f) * 4;
  const messageType = buffer.readUInt8(1) >> 4;
  const flags = buffer.readUInt8(1) & 0x0f;
  const serialization = buffer.readUInt8(2) >> 4;
  const compression = buffer.readUInt8(2) & 0x0f;
  let offset = headerSize;
  const packet: ParsedRealtimePacket = { messageType, flags };

  if (messageType === SERVER_ERROR_RESPONSE) {
    packet.code = buffer.readUInt32BE(offset);
    offset += 4;
    const payloadSize = buffer.readUInt32BE(offset);
    offset += 4;
    const payloadBuffer = buffer.subarray(offset, offset + payloadSize);
    Object.assign(packet, readPayload(payloadBuffer, serialization, compression));
    return packet;
  }

  if (
    messageType !== SERVER_FULL_RESPONSE &&
    messageType !== SERVER_AUDIO_ONLY_RESPONSE
  ) {
    return packet;
  }

  if ((flags & 0b0011) > 0) {
    offset += 4;
  }

  if ((flags & FLAG_WITH_EVENT) > 0) {
    packet.event = buffer.readUInt32BE(offset);
    offset += 4;
  }

  const sessionResult = maybeReadSessionId(buffer, offset);
  packet.sessionId = sessionResult.sessionId;
  offset = sessionResult.offset;

  if (offset + 4 > buffer.length) {
    return packet;
  }

  const payloadSize = buffer.readUInt32BE(offset);
  offset += 4;
  const payloadBuffer = buffer.subarray(offset, offset + payloadSize);
  Object.assign(packet, readPayload(payloadBuffer, serialization, compression));

  return packet;
}

function payloadMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const value = payload as {
    error?: string;
    message?: string;
    status_code?: string | number;
  };

  return value.error ?? value.message ?? value.status_code?.toString();
}

function normalizeRealtimeModel(model: string) {
  if (model === 'AG-voice-chat-agent' || model === 'doubao-tts') {
    return DEFAULT_REALTIME_MODEL;
  }

  return model;
}

function normalizeVoiceType(voiceType: string) {
  if (voiceType === 'zh_female_wanwanxiaohe_moon_bigtts') {
    return DEFAULT_VOICE_TYPE;
  }

  return voiceType;
}

export function buildStartSessionPayload({
  model,
  voiceType,
  timeoutMs,
  inputMode = 'text',
}: {
  model: string;
  voiceType: string;
  timeoutMs: number;
  inputMode?: 'text' | 'audio';
}) {
  const dialogExtra: Record<string, unknown> = {
    strict_audit: false,
    recv_timeout: Math.min(120, Math.max(10, Math.ceil(timeoutMs / 1000))),
    enable_loudness_norm: true,
    enable_conversation_truncate: false,
    model,
  };

  if (inputMode === 'text') {
    dialogExtra.input_mod = 'text';
  }

  return {
    asr: {
      extra: {
        end_smooth_window_ms: 1500,
      },
    },
    tts: {
      speaker: voiceType,
      audio_config: {
        channel: 1,
        format: 'pcm_s16le',
        sample_rate: PCM_SAMPLE_RATE,
      },
    },
    dialog: {
      bot_name: '赵都云旅',
      system_role:
        inputMode === 'text'
          ? '你是邯郸智能文旅语音导游，也是一台语音播报引擎。收到用户给定的播报文本时，请只用自然中文朗读该文本，不要扩展、解释或添加开场白。'
          : '你是“赵都云旅·云端图鉴智行指南”的邯郸实时语音导游。用户会直接用语音和你聊天。请像真人导游一样自然、简短、具体地回答，优先围绕邯郸景点、美食、路线、节奏和注意事项，不要说开发者术语。每次回答尽量控制在 60 到 140 个中文字符。',
      speaking_style: '亲切自然，语速适中，像真人导游一样清楚好听。',
      location: {
        country: '中国',
        country_code: 'CN',
        province: '河北',
        city: '邯郸',
      },
      extra: dialogExtra,
    },
  };
}

function sendFinishFrames(ws: WebSocket, sessionId: string) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(encodeEventFrame({ event: EVENT_FINISH_SESSION, sessionId }));
  ws.send(encodeEventFrame({ event: EVENT_FINISH_CONNECTION }));
}

export function getRealtimeVoiceConfig() {
  return {
    apiKey:
      process.env.VOICE_REALTIME_API_KEY ??
      process.env.VOLCENGINE_REALTIME_API_KEY,
    appId:
      process.env.VOICE_REALTIME_APP_ID ??
      process.env.VOLCENGINE_REALTIME_APP_ID,
    appKey: process.env.VOICE_REALTIME_APP_KEY ?? DEFAULT_APP_KEY,
    baseUrl: process.env.VOICE_REALTIME_BASE_URL ?? DEFAULT_REALTIME_URL,
    model: normalizeRealtimeModel(
      process.env.VOICE_REALTIME_MODEL ??
        process.env.VOICE_REALTIME_DIALOG_MODEL ??
        DEFAULT_REALTIME_MODEL,
    ),
    voiceType: normalizeVoiceType(process.env.VOICE_TYPE ?? DEFAULT_VOICE_TYPE),
    resourceId: process.env.VOICE_REALTIME_RESOURCE_ID ?? DEFAULT_RESOURCE_ID,
  };
}

export async function synthesizeWithRealtimeVoice({
  text,
  apiKey,
  appId,
  appKey = DEFAULT_APP_KEY,
  baseUrl = DEFAULT_REALTIME_URL,
  model = DEFAULT_REALTIME_MODEL,
  voiceType = DEFAULT_VOICE_TYPE,
  timeoutMs = Number(process.env.VOICE_TIMEOUT_MS ?? 25000),
  resourceId = DEFAULT_RESOURCE_ID,
}: RealtimeTtsOptions): Promise<RealtimeTtsResult> {
  if (!apiKey) {
    throw new Error('missing_realtime_voice_access_key');
  }

  if (!appId) {
    throw new Error('missing_realtime_voice_app_id');
  }

  const sessionId = randomUUID();
  const connectId = randomUUID();
  const dialogModel = normalizeRealtimeModel(model);
  const speaker = normalizeVoiceType(voiceType);
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    let settled = false;
    let ttsRequested = false;

    const ws = new WebSocket(baseUrl, {
      headers: {
        'X-Api-App-ID': appId,
        'X-Api-Access-Key': apiKey,
        'X-Api-Resource-Id': resourceId,
        'X-Api-App-Key': appKey,
        'X-Api-Connect-Id': connectId,
      },
    });

    const timer = setTimeout(() => {
      rejectOnce(new Error('realtime_voice_timeout'));
    }, timeoutMs);

    function closeSocket() {
      clearTimeout(timer);

      if (ws.readyState === WebSocket.OPEN) {
        sendFinishFrames(ws, sessionId);
      }

      ws.close();
    }

    function rejectOnce(error: Error) {
      if (settled) {
        return;
      }

      settled = true;
      closeSocket();
      reject(error);
    }

    function resolveOnce(result: RealtimeTtsResult) {
      if (settled) {
        return;
      }

      settled = true;
      closeSocket();
      resolve(result);
    }

    function sendStartSession() {
      const payload = buildStartSessionPayload({
        model: dialogModel,
        voiceType: speaker,
        timeoutMs,
      });

      ws.send(
        encodeEventFrame({
          event: EVENT_START_SESSION,
          sessionId,
          payload,
        }),
      );
    }

    function sendChatTextQuery() {
      if (ttsRequested) {
        return;
      }

      ttsRequested = true;
      ws.send(
        encodeEventFrame({
          event: EVENT_CHAT_TEXT_QUERY,
          sessionId,
          payload: {
            content: `请只朗读以下文字，不要添加任何额外内容：${text}`,
          },
        }),
      );
    }

    ws.on('open', () => {
      ws.send(encodeEventFrame({ event: EVENT_START_CONNECTION }));
    });

    ws.on('message', (data) => {
      let packet: ParsedRealtimePacket;

      try {
        packet = parseRealtimePacket(data);
      } catch (error) {
        rejectOnce(
          error instanceof Error
            ? error
            : new Error('invalid_realtime_voice_packet'),
        );
        return;
      }

      if (packet.messageType === SERVER_ERROR_RESPONSE) {
        rejectOnce(
          new Error(
            `realtime_voice_error_${packet.code ?? 'unknown'}: ${
              payloadMessage(packet.payload) ?? 'unknown provider error'
            }`,
          ),
        );
        return;
      }

      if (
        packet.event === EVENT_CONNECTION_FAILED ||
        packet.event === EVENT_SESSION_FAILED ||
        packet.event === EVENT_DIALOG_COMMON_ERROR
      ) {
        rejectOnce(
          new Error(payloadMessage(packet.payload) ?? 'realtime_voice_failed'),
        );
        return;
      }

      if (packet.event === EVENT_CONNECTION_STARTED) {
        sendStartSession();
        return;
      }

      if (packet.event === EVENT_SESSION_STARTED) {
        sendChatTextQuery();
        return;
      }

      if (
        packet.event === EVENT_TTS_RESPONSE &&
        packet.payloadBuffer?.byteLength
      ) {
        chunks.push(packet.payloadBuffer);
        return;
      }

      if (packet.event === EVENT_TTS_ENDED) {
        if (!chunks.length) {
          rejectOnce(new Error('realtime_voice_empty_audio'));
          return;
        }

        const audio = Buffer.concat(chunks);
        resolveOnce({
          audio: Buffer.concat([createWavHeader(audio.length), audio]),
          contentType: 'audio/wav',
          model: dialogModel,
          voiceType: speaker,
        });
      }
    });

    ws.on('error', (error) => {
      rejectOnce(error instanceof Error ? error : new Error(String(error)));
    });

    ws.on('close', () => {
      if (!settled) {
        rejectOnce(new Error('realtime_voice_closed'));
      }
    });
  });
}
