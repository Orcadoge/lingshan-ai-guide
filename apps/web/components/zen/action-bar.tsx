"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Send, Square } from "lucide-react";

interface ActionBarProps {
  onSendMessage?: (text: string) => void;
  onToggleVoice?: () => void;
  isVoiceActive?: boolean;
  disabled?: boolean;
}

export function ActionBar({
  onSendMessage,
  onToggleVoice,
  isVoiceActive = false,
  disabled = false,
}: ActionBarProps) {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!inputText.trim() || disabled) return;
    onSendMessage?.(inputText.trim());
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex h-[10%] w-full items-center gap-3 border-t border-zen-bamboo/10 bg-zen-paper/80 px-4 backdrop-blur-xl"
    >
      {/* 文本输入框 - 胶囊状 */}
      <div className="flex flex-1 items-center"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问灵灵关于灵山胜境的问题..."
          disabled={disabled}
          className="w-full rounded-full border-none bg-zen-ink/5 px-4 py-2.5 text-sm text-zen-ink placeholder:text-zen-ash/40 outline-none transition-colors focus:bg-zen-ink/10"
        />
        {inputText.trim() && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-zen-bamboo text-white shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>

      {/* 语音按钮 - 圆形 */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleVoice}
        disabled={disabled}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md transition-colors ${
          isVoiceActive
            ? "bg-red-500 text-white shadow-red-500/30"
            : "bg-zen-bamboo text-white shadow-zen-bamboo/30"
        }`}
      >
        {isVoiceActive ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </motion.button>
    </motion.div>
  );
}
