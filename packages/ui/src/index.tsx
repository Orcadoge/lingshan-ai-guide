import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b765b]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#1d221e] md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-[#626056] md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#d7cec0] bg-white/70 px-3 py-1 text-xs font-medium text-[#5f584c]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 border-t border-[#ddd5c9] pt-4">
      <p className="text-xs uppercase tracking-[0.28em] text-[#8b765b]">{label}</p>
      <p className="text-2xl font-semibold text-[#1d221e]">{value}</p>
    </div>
  );
}

export function Surface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#e7e0d5] bg-white/84 shadow-[0_20px_60px_rgba(43,41,35,0.08)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
