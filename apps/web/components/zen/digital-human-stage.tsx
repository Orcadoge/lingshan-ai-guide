"use client";

import { motion } from "framer-motion";
import { Shirt } from "lucide-react";

interface DigitalHumanStageProps {
  backgroundImage?: string;
  isSpeaking?: boolean;
}

export function DigitalHumanStage({
  backgroundImage,
  isSpeaking = false,
}: DigitalHumanStageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative flex h-[40%] w-full flex-col items-center justify-center overflow-hidden"
    >
      {/* 背景图 + 高斯模糊 */}
      {backgroundImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-zen-paper/60 backdrop-blur-xl" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zen-paper via-zen-paper/90 to-zen-paper/70" />
      )}

      {/* 柔和光晕装饰 */}
      <div className="absolute left-1/4 top-1/3 h-32 w-32 rounded-full bg-zen-bamboo/10 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-24 w-24 rounded-full bg-zen-glaze/10 blur-3xl" />

      {/* 切换服装按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-white/30 bg-zen-glass px-3 py-1.5 text-xs text-zen-ink backdrop-blur-xl transition-colors hover:bg-white/40"
      >
        <Shirt className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">切换服装</span>
      </motion.button>

      {/* 数字人挂载区域 */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          id="digital-human-canvas"
          className="relative flex h-48 w-48 items-center justify-center rounded-full border-2 border-zen-bamboo/20 bg-gradient-to-br from-zen-paper to-white shadow-xl shadow-zen-bamboo/10"
        >
          {/* 占位：数字人模型/视频流将挂载于此 */}
          <div className="flex flex-col items-center gap-2 text-zen-ash/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zen-bamboo/10">
              <svg
                className="h-8 w-8 text-zen-bamboo/40"
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
            <span className="text-xs">数字人导游</span>
          </div>

          {/* 语音指示器 */}
          {isSpeaking && (
            <motion.div
              className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-zen-bamboo"
                  animate={{
                    scaleY: [0.5, 1.5, 0.5],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* 导游名字 */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-sm font-medium text-zen-ink"
        >
          灵灵
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-0.5 text-xs text-zen-ash/70"
        >
          灵山胜境专属数字导游
        </motion.p>
      </div>
    </motion.div>
  );
}
