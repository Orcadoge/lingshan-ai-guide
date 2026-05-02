"use client";

import { LoaderCircle, Mic, Radio, Send, Square, Volume2, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  askVoiceGuide,
  getRealtimeVoiceWsUrl,
  synthesizeVoice,
  type VoiceGuideMessage,
} from "../lib/api";

type AudioContextConstructor = typeof AudioContext;

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: AudioContextConstructor;
};

type RealtimeState = "idle" | "connecting" | "listening";

type RealtimeServerMessage = {
  type: "ready" | "status" | "event" | "error" | "pong";
  status?: string;
  message?: string;
  event?: number;
  name?: string;
  data?: unknown;
  model?: string;
};

const INITIAL_MESSAGES: VoiceGuideMessage[] = [
  {
    role: "assistant",
    content:
      "我是你的邯郸语音导游，点一下麦克风后直接说话，我会用语音回答你。",
  },
];

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const ASR_INFO_EVENT = 450;
const ASR_RESPONSE_EVENT = 451;
const CHAT_RESPONSE_EVENT = 550;
const CHAT_ENDED_EVENT = 559;
const TTS_ENDED_EVENT = 359;

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext ?? null;
}

function isLocalhostOrigin() {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function getMicUnavailableHint() {
  if (typeof window === "undefined") {
    return "当前环境暂时不能使用麦克风。";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "当前设备暂时不能直接说话，可以先打字问我。";
  }

  if (!window.isSecureContext && !isLocalhostOrigin()) {
    return "为了保护你的语音，请用正式的网址打开后再试。";
  }

  return "";
}

function formatMicError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return error instanceof Error ? error.message : "麦克风没有启动成功。";
  }

  if (error.name === "NotAllowedError") {
    return "我还听不到你的声音，请允许麦克风后再试。";
  }

  if (error.name === "NotFoundError") {
    return "没有检测到可用麦克风，请检查系统输入设备。";
  }

  if (error.name === "NotReadableError") {
    return "麦克风正在被其他应用占用，关闭占用后再试。";
  }

  return error.message || "麦克风没有启动成功。";
}

function clampSample(sample: number) {
  return Math.max(-1, Math.min(1, sample));
}

function downsampleToInt16Pcm(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate = INPUT_SAMPLE_RATE,
) {
  if (sourceSampleRate === targetSampleRate) {
    const output = new Int16Array(input.length);
    for (let index = 0; index < input.length; index += 1) {
      const sample = clampSample(input[index] ?? 0);
      output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output.buffer;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Int16Array(outputLength);
  let sourceOffset = 0;

  for (let outputOffset = 0; outputOffset < outputLength; outputOffset += 1) {
    const nextSourceOffset = Math.round((outputOffset + 1) * ratio);
    let sum = 0;
    let count = 0;

    for (
      let index = sourceOffset;
      index < nextSourceOffset && index < input.length;
      index += 1
    ) {
      sum += input[index] ?? 0;
      count += 1;
    }

    const sample = clampSample(count ? sum / count : 0);
    output[outputOffset] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    sourceOffset = nextSourceOffset;
  }

  return output.buffer;
}

function extractTextFromPayload(payload: unknown, depth = 0): string | null {
  if (!payload || depth > 4) {
    return null;
  }

  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = extractTextFromPayload(item, depth + 1);
      if (text) {
        return text;
      }
    }
    return null;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const likelyTextKeys = [
    "text",
    "content",
    "answer",
    "response",
    "sentence",
    "transcript",
    "utterance",
    "result",
  ];

  for (const key of likelyTextKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  for (const value of Object.values(record)) {
    const text = extractTextFromPayload(value, depth + 1);
    if (text) {
      return text;
    }
  }

  return null;
}

function speakWithBrowser(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.96;
  utterance.pitch = 1.02;
  window.speechSynthesis.speak(utterance);
}

async function playAudioBase64(audioBase64: string, contentType: string) {
  const audio = new Audio(`data:${contentType};base64,${audioBase64}`);
  await audio.play();
}

export function VoiceGuide() {
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const [messages, setMessages] = useState<VoiceGuideMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("idle");
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("点一下麦克风，直接和邯郸导游说话");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hint = getMicUnavailableHint();

    if (hint) {
      setStatus(hint);
    }

    return () => {
      stopRealtime();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function upsertMessage(role: VoiceGuideMessage["role"], content: string) {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => {
      const last = current.at(-1);

      if (last?.role === role) {
        if (last.content === trimmed) {
          return current;
        }

        return [...current.slice(0, -1), { role, content: trimmed }];
      }

      return [...current, { role, content: trimmed }];
    });
  }

  async function getAudioContext() {
    const AudioContextClass = getAudioContextConstructor();

    if (!AudioContextClass) {
      throw new Error("当前设备暂时不能播放语音，可以先看文字回复。");
    }

    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }

  function clearPlayback() {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // The source may already have ended.
      }
    }

    activeSourcesRef.current = [];
    nextPlayTimeRef.current = audioContextRef.current?.currentTime ?? 0;
    setIsSpeaking(false);
  }

  async function schedulePcmPlayback(buffer: ArrayBuffer) {
    const context = await getAudioContext();
    const pcm = new Int16Array(buffer);

    if (!pcm.length) {
      return;
    }

    const floatData = new Float32Array(pcm.length);
    for (let index = 0; index < pcm.length; index += 1) {
      floatData[index] = (pcm[index] ?? 0) / 0x8000;
    }

    const audioBuffer = context.createBuffer(1, floatData.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(floatData, 0);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);

    const startAt = Math.max(context.currentTime + 0.04, nextPlayTimeRef.current);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;
    activeSourcesRef.current.push(source);
    setIsSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((item) => item !== source);
      if (!activeSourcesRef.current.length) {
        setIsSpeaking(false);
      }
    };

    source.start(startAt);
  }

  async function startCapture(stream: MediaStream, ws: WebSocket) {
    const context = await getAudioContext();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      event.outputBuffer.getChannelData(0).fill(0);

      if (ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const pcm = downsampleToInt16Pcm(input, context.sampleRate);
      ws.send(pcm);
    };

    source.connect(processor);
    processor.connect(context.destination);
    sourceRef.current = source;
    processorRef.current = processor;
    setRealtimeState("listening");
    setStatus("语音导游已接通，可以直接说话");
  }

  function stopCapture() {
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRealtime() {
    setRealtimeState("idle");
    stopCapture();
    clearPlayback();

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
    }

    wsRef.current?.close();
    wsRef.current = null;
    setStatus("点一下麦克风，直接和邯郸导游说话");
  }

  function handleRealtimeEvent(message: RealtimeServerMessage) {
    const text = extractTextFromPayload(message.data);

    if (message.event === ASR_INFO_EVENT) {
      clearPlayback();
      setStatus("我听到你说话了，正在理解");
      return;
    }

    if (message.event === ASR_RESPONSE_EVENT) {
      if (text) {
        upsertMessage("user", text);
      }
      setStatus("我正在整理适合你的建议");
      return;
    }

    if (message.event === CHAT_RESPONSE_EVENT) {
      if (text) {
        upsertMessage("assistant", text);
      }
      setStatus("正在语音回答你");
      return;
    }

    if (message.event === CHAT_ENDED_EVENT || message.event === TTS_ENDED_EVENT) {
      setStatus("可以继续说话，我会接着回答");
    }
  }

  async function startRealtime() {
    if (realtimeState !== "idle") {
      stopRealtime();
      return;
    }

    const hint = getMicUnavailableHint();

    if (hint) {
      setError(hint);
      return;
    }

    setError(null);
    setRealtimeState("connecting");
    setStatus("正在请语音导游上线");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const ws = new WebSocket(getRealtimeVoiceWsUrl());
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          void schedulePcmPlayback(event.data);
          return;
        }

        if (typeof event.data !== "string") {
          return;
        }

        const message = JSON.parse(event.data) as RealtimeServerMessage;

        if (message.type === "ready") {
          setStatus("语音导游已准备好，可以直接说话");
          void startCapture(stream, ws);
          return;
        }

        if (message.type === "event") {
          handleRealtimeEvent(message);
          return;
        }

        if (message.type === "error") {
          setError("语音导游暂时没有接通，可以稍后再试。");
          stopRealtime();
        }
      };

      ws.onerror = () => {
        setError("语音导游暂时没有接通，可以稍后再试。");
        stopRealtime();
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          stopRealtime();
        }
      };
    } catch (micError) {
      setError(formatMicError(micError));
      stopRealtime();
    }
  }

  async function playGuideReply(reply: string) {
    setIsSpeaking(true);

    try {
      const audio = await synthesizeVoice(reply);

      if (audio.audioBase64 && audio.contentType) {
        await playAudioBase64(audio.audioBase64, audio.contentType);
        return true;
      }

      speakWithBrowser(reply);
      return false;
    } catch {
      speakWithBrowser(reply);
      return false;
    } finally {
      setIsSpeaking(false);
    }
  }

  async function submitMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isThinking) {
      return;
    }

    setInputValue("");
    setError(null);

    if (wsRef.current?.readyState === WebSocket.OPEN && realtimeState !== "idle") {
      upsertMessage("user", trimmed);
      wsRef.current.send(JSON.stringify({ type: "text", content: trimmed }));
      setStatus("已经收到，我马上回答");
      return;
    }

    setIsThinking(true);
    setStatus("导游正在整理回答");

    const nextMessages: VoiceGuideMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);

    try {
      const result = await askVoiceGuide({
        message: trimmed,
        history: messages,
      });
      const reply = result.reply;

      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      const usedRealtimeVoice = await playGuideReply(reply);
      setStatus(
        usedRealtimeVoice ? "语音导游已回答" : "我已经把建议读给你听了",
      );
    } catch (voiceError) {
      const messageText =
        voiceError instanceof Error
          ? voiceError.message
          : "语音导游暂时不可用，请稍后再试。";
      setError(messageText);
      setStatus("语音导游暂时不可用");
    } finally {
      setIsThinking(false);
    }
  }

  const isRealtimeActive = realtimeState !== "idle";
  const isWaveActive = isRealtimeActive || isSpeaking;

  return (
    <section className="voice-card relative overflow-hidden rounded-[30px] border border-white/28 bg-[#171a16]/82 p-4 text-white shadow-[0_24px_80px_rgba(13,15,12,0.28)] backdrop-blur-2xl md:p-5">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#d8a85c]/28 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-[#5f876b]/24 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="voice-orb grid h-12 w-12 place-items-center rounded-full border border-white/18 bg-white/10">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">语音导游</p>
            <p className="mt-1 text-xs text-white/58">
              点麦克风，像问本地向导一样开口
            </p>
          </div>
        </div>
        <div className="flex h-9 items-end gap-1.5 rounded-full border border-white/12 bg-white/8 px-3 py-2">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className={`voice-bar h-3 w-1.5 rounded-full bg-[#f3c77a] ${
                isWaveActive ? "is-active" : ""
              }`}
              style={{ animationDelay: `${bar * 90}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
        {messages.slice(-4).map((message, index) => (
          <div
            key={`${message.role}-${index}-${message.content}`}
            className={`message-in rounded-[22px] px-4 py-3 text-sm leading-7 ${
              message.role === "user"
                ? "ml-auto max-w-[88%] bg-white text-[#20231e]"
                : "mr-auto max-w-[92%] border border-white/10 bg-white/10 text-white/84"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form
        className="relative mt-4 flex items-end gap-2 rounded-[24px] border border-white/14 bg-white/10 p-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submitMessage(inputValue);
        }}
      >
        <button
          type="button"
          onClick={() => void startRealtime()}
          disabled={isThinking || realtimeState === "connecting"}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isRealtimeActive
              ? "bg-white text-[#20231e] hover:bg-[#f7eedb]"
              : "bg-[#f3c77a] text-[#22180c] hover:bg-[#ffd990]"
          }`}
          aria-label={isRealtimeActive ? "停止实时语音" : "开始实时语音"}
        >
          {realtimeState === "connecting" ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : realtimeState === "listening" ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="min-h-11 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/42"
          placeholder="也可以输入：带父母一天怎么玩？"
        />
        <button
          type="submit"
          disabled={isThinking || !inputValue.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#20231e] transition hover:bg-[#f7eedb] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="发送语音导游问题"
        >
          {isThinking ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="h-4 w-4" />
          ) : isRealtimeActive ? (
            <Waves className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      <p className="relative mt-3 text-xs text-white/58">{error ?? status}</p>
    </section>
  );
}
