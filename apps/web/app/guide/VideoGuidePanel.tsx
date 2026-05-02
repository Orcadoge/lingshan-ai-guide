"use client";

import { LoaderCircle, Radio, Video } from "lucide-react";
import { useEffect, useRef } from "react";

import type { GuideSessionSnapshot } from "../../components/voice-guide";

type VideoGuidePanelProps = {
  session: GuideSessionSnapshot;
  className?: string;
};

export function VideoGuidePanel({ session, className }: VideoGuidePanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reserved for WebRTC tracks in follow-up integration.
  function attachWebRtcStream(stream: MediaStream | null) {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = stream;
  }

  // Reserved for HLS URL assignment in follow-up integration.
  function attachHlsStream(hlsUrl: string | null) {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = null;
    videoRef.current.src = hlsUrl ?? "";
  }

  useEffect(() => {
    attachWebRtcStream(null);
    attachHlsStream(null);
  }, []);

  const statusText = session.listening
    ? "正在倾听..."
    : session.thinking
      ? "导游思考中..."
      : "数字导游待命中";

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] border border-white/28 bg-[#171a16]/82 p-4 text-white shadow-[0_24px_80px_rgba(13,15,12,0.28)] backdrop-blur-2xl md:p-5 ${
        className ?? ""
      }`}
    >
      <div className="pointer-events-none absolute -left-16 -top-12 h-48 w-48 rounded-full bg-[#8e6a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-8 h-44 w-44 rounded-full bg-[#5f876b]/24 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-white/18 bg-white/10">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">数字人画面</p>
            <p className="mt-1 text-xs text-white/58">预留 WebRTC / HLS 流接入</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80">
          <Radio className="h-3.5 w-3.5" />
          实时会话联动
        </span>
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-[24px] border bg-black/50 ${
          session.speaking
            ? "border-[#f3c77a] shadow-[0_0_0_2px_rgba(243,199,122,0.24)]"
            : "border-white/20"
        }`}
      >
        <video
          ref={videoRef}
          className="h-[290px] w-full bg-black object-cover md:h-[360px]"
          autoPlay
          playsInline
          muted
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <p className="text-sm text-white/88">{statusText}</p>
        </div>
        {session.thinking ? (
          <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            导游思考中...
          </div>
        ) : null}
      </div>
    </section>
  );
}
