"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "guide";
  content: string;
  type?: "text" | "attraction";
  attraction?: {
    name: string;
    image: string;
    tags: string[];
    duration: string;
  };
}

const mockMessages: Message[] = [
  {
    id: "1",
    role: "guide",
    content: "欢迎来到灵山胜境！我是您的专属数字导游灵灵，身着一袭素雅青衣，愿以千年禅意，伴您开启这段净心之旅。",
  },
  {
    id: "2",
    role: "user",
    content: "灵山大佛有多高？",
  },
  {
    id: "3",
    role: "guide",
    content: "灵山大佛高达88米，是世界上最高的露天青铜释迦牟尼立像。它坐落于太湖之北岸，与香港天坛大佛、四川乐山大佛等并称\"五方五佛\"。",
    type: "attraction",
    attraction: {
      name: "灵山大佛",
      image: "/images/attractions/lingshan-buddha.jpg",
      tags: ["地标", "祈福"],
      duration: "建议90分钟",
    },
  },
];

export default function ChatStream() {
  const [messages] = useState<Message[]>(mockMessages);

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide px-4 py-3 space-y-3">
      {messages.map((msg, idx) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.3 }}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "user" ? (
            <div className="max-w-[80%] bg-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm text-zen-ash text-sm leading-relaxed">
              {msg.content}
            </div>
          ) : (
            <div className="max-w-[85%]">
              <div className="text-zen-ink text-[15px] leading-relaxed">
                {msg.content}
              </div>
              {msg.type === "attraction" && msg.attraction && (
                <div className="mt-2.5 bg-white rounded-xl overflow-hidden shadow-sm border border-zen-shadow">
                  <div className="h-28 bg-zen-paper relative">
                    <img
                      src={msg.attraction.image}
                      alt={msg.attraction.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-zen-ink font-medium text-sm">
                      {msg.attraction.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {msg.attraction.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-zen-bamboo/10 text-zen-bamboo text-[11px] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-zen-glaze text-[11px]">
                        {msg.attraction.duration}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
      
      {/* 加载指示器 */}
      <div className="flex justify-start">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <div className="w-1.5 h-1.5 bg-zen-bamboo rounded-full animate-pulse-soft" />
          <div className="w-1.5 h-1.5 bg-zen-bamboo rounded-full animate-pulse-soft [animation-delay:0.2s]" />
          <div className="w-1.5 h-1.5 bg-zen-bamboo rounded-full animate-pulse-soft [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
