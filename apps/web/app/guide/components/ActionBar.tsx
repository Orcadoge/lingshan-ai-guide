"use client";

import { useState } from "react";
import { Mic, Send } from "lucide-react";

export default function ActionBar() {
  const [input, setInput] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  return (
    <div className="h-full w-full px-4 py-2 flex items-center gap-3 bg-zen-fog/80 backdrop-blur-glass border-t border-zen-shadow">
      {/* 文本输入框 */}
      <div className="flex-1 flex items-center bg-zen-ink/5 rounded-full px-4 py-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="向灵灵提问..."
          className="flex-1 bg-transparent text-sm text-zen-ink placeholder:text-zen-ash/50 outline-none"
        />
        {input && (
          <button className="ml-2 text-zen-bamboo hover:text-zen-ink transition-colors">
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 语音按钮 */}
      <button
        onClick={() => setIsVoiceActive(!isVoiceActive)}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
          isVoiceActive
            ? "bg-zen-glaze text-white shadow-lg shadow-zen-glaze/30 scale-105"
            : "bg-zen-bamboo text-white hover:bg-zen-bamboo/90"
        }`}
      >
        <Mic className="w-5 h-5" />
      </button>
    </div>
  );
}
