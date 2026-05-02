"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  isUser?: boolean;
}

export function MessageBubble({ content, isUser = false }: MessageBubbleProps) {
  if (isUser) {
    return (
      <div className="mb-3 flex justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[80%] rounded-2xl rounded-tr-none bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-sm leading-relaxed text-zen-ash">{content}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-start gap-2">
      {/* 导游头像 */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zen-bamboo/15"
      >
        <svg
          className="h-4 w-4 text-zen-bamboo"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      </div>

      {/* 导游消息 - 无边框气泡，直接显示文本 */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[80%]"
      >
        <p className="text-sm leading-relaxed text-zen-ink">{content}</p>
      </motion.div>
    </div>
  );
}
