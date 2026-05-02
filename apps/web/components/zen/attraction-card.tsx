"use client";

import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";

interface AttractionCardProps {
  name: string;
  image?: string;
  tags: string[];
  description: string;
  duration: string;
  isUser?: boolean;
}

export function AttractionCard({
  name,
  image,
  tags,
  description,
  duration,
  isUser = false,
}: AttractionCardProps) {
  if (isUser) {
    return (
      <div className="mb-3 flex justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[80%] rounded-2xl rounded-tr-none bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-sm text-zen-ash">{name}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4 flex items-start gap-2"
    >
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

      {/* 景点卡片 */}
      <div className="max-w-[85%] overflow-hidden rounded-2xl border border-zen-bamboo/10 bg-white shadow-sm"
      >
        {/* 景点图片 */}
        {image ? (
          <div className="relative h-32 w-full overflow-hidden"
          >
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-zen-paper to-zen-bamboo/10"
          >
            <div className="flex flex-col items-center gap-1 text-zen-ash/40"
            >
              <MapPin className="h-8 w-8" />
              <span className="text-xs">{name}</span>
            </div>
          </div>
        )}

        {/* 卡片内容 */}
        <div className="p-3"
        >
          <h3 className="text-sm font-semibold text-zen-ink">{name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-zen-ash/80">{description}</p>

          {/* 标签 */}
          <div className="mt-2 flex flex-wrap gap-1.5"
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zen-bamboo/10 px-2 py-0.5 text-xs text-zen-bamboo"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 时长 */}
          <div className="mt-2 flex items-center gap-1 text-xs text-zen-ash/60"
          >
            <Clock className="h-3 w-3" />
            <span>建议停留 {duration}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
