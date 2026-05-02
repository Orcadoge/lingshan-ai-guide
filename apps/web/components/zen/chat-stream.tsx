"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { AttractionCard } from "./attraction-card";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "attraction" | "route";
  attraction?: {
    name: string;
    image?: string;
    tags: string[];
    description: string;
    duration: string;
  };
}

interface ChatStreamProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatStream({ messages, isLoading }: ChatStreamProps) {
  return (
    <div className="flex h-[50%] w-full flex-col bg-zen-paper">
      {/* 对话流标题 */}
      <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider text-zen-ash/60 uppercase">
        <Sparkles className="h-3 w-3" />
        <span>对话记录</span>
      </div>

      {/* 消息列表 - 可滚动 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.42,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {msg.type === "attraction" && msg.attraction ? (
                <AttractionCard
                  name={msg.attraction.name}
                  image={msg.attraction.image}
                  tags={msg.attraction.tags}
                  description={msg.attraction.description}
                  duration={msg.attraction.duration}
                  isUser={msg.role === "user"}
                />
              ) : (
                <MessageBubble
                  content={msg.content}
                  isUser={msg.role === "user"}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 加载指示器 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-2 pl-2"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-zen-bamboo/60"
                  animate={{
                    scale: [0.6, 1.2, 0.6],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-zen-ash/50">灵灵正在思考...</span>
          </motion.div>
        )}
      </div>

      {/* 底部渐变遮罩 */}
      <div className="pointer-events-none h-4 w-full bg-gradient-to-t from-zen-paper to-transparent" />
    </div>
  );
}
