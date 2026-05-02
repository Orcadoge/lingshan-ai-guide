"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function DigitalHumanStage() {
  const [isSpeaking, setIsSpeaking] = useState(true);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 背景图 + 高斯模糊 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/bg-lingshan-dawn.jpg')",
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[2px] bg-zen-ink/10" />
      </div>

      {/* 数字人画布区域 */}
      <div
        id="digital-human-canvas"
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* 数字人占位/视频容器 */}
        <div className="relative w-full max-w-[280px] h-full flex items-end justify-center">
          {/* 音波动画 */}
          {isSpeaking && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1 z-10">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-zen-glaze/60 rounded-full"
                  animate={{
                    height: [8, 20 + i * 6, 8],
                  }}
                  transition={{
                    duration: 0.6 + i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* 数字人占位图 */}
          <motion.img
            src="/images/avatar-tourguide.jpg"
            alt="数字人导游灵灵"
            className="h-[85%] object-contain object-bottom"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zen-paper to-transparent pointer-events-none" />
    </div>
  );
}
