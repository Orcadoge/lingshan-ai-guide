"use client";

import { planIntentSchema } from "@handan/shared";
import {
  ArrowRight,
  Compass,
  LoaderCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { generatePlanStream, type PlanStreamProgress } from "../lib/api";
import { quickPrompts } from "../lib/content";

type Step = "intro" | "focus" | "schedule" | "travel" | "ready";
type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};
type Preferences = {
  originalQuery: string;
  durationDays: 0.5 | 1 | 2 | 3 | 4 | 5;
  transportMode: "self-drive" | "public" | "taxi" | "walk-first";
  companions: Array<"solo" | "couple" | "friends" | "family" | "parents">;
  budgetLevel: "low" | "medium" | "high" | "custom";
  budgetAmount: number | null;
  interests: Array<
    "history" | "mountain" | "taiji" | "red" | "citywalk" | "food" | "photo"
  >;
  foodPreferences: Array<
    "spicy" | "non-spicy" | "light" | "local-specialty" | "exclude-ingredient"
  >;
  pace: "relaxed" | "standard" | "compact";
  constraints: string[];
  mustVisitSlugs: string[];
};
type QuickReply = {
  label: string;
  reply: string;
  patch: Partial<Preferences>;
  next: Step;
  assistant: string;
};

const DEFAULT_PREFERENCES: Preferences = {
  originalQuery: quickPrompts[0] ?? "周末来邯郸两天，想看历史，也想吃本地特色。",
  durationDays: 2,
  transportMode: "public",
  companions: ["friends"],
  budgetLevel: "medium",
  budgetAmount: null,
  interests: ["history", "food"],
  foodPreferences: ["local-specialty"],
  pace: "standard",
  constraints: [],
  mustVisitSlugs: [],
};

const STEP_ASSISTANT: Record<Step, string> = {
  intro: "你好，我是你的 AI 导游。先告诉我这次想怎么逛邯郸，随便一句话就行。",
  focus: "听起来不错。这趟更想偏向哪一种体验？",
  schedule: "明白了。时间和节奏怎么安排更合适？",
  travel: "最后确认一下出行方式和同行人，我就可以开始规划。",
  ready: "信息够用了。我会把景点、美食、顺路程度和节奏一起考虑，生成一份完整路线。",
};

const FOCUS_REPLIES: QuickReply[] = [
  {
    label: "历史文化 + 本地美食",
    reply: "我更想看历史文化，也想吃本地特色。",
    patch: {
      interests: ["history", "food"],
      foodPreferences: ["local-specialty"],
    },
    next: "schedule",
    assistant: STEP_ASSISTANT.schedule,
  },
  {
    label: "街区慢游",
    reply: "我想轻松逛逛街区，别太赶。",
    patch: {
      interests: ["citywalk", "food", "photo"],
      pace: "relaxed",
    },
    next: "schedule",
    assistant: STEP_ASSISTANT.schedule,
  },
  {
    label: "山水拍照",
    reply: "我更想看山水，也想拍照出片。",
    patch: {
      interests: ["mountain", "photo"],
      pace: "standard",
    },
    next: "schedule",
    assistant: STEP_ASSISTANT.schedule,
  },
  {
    label: "带父母慢慢逛",
    reply: "这次带父母，希望轻松一点。",
    patch: {
      interests: ["history", "food"],
      companions: ["parents"],
      pace: "relaxed",
      constraints: ["少走路"],
    },
    next: "schedule",
    assistant: STEP_ASSISTANT.schedule,
  },
];

const SCHEDULE_REPLIES: QuickReply[] = [
  {
    label: "半天轻松逛",
    reply: "我只有半天，轻松一点就好。",
    patch: { durationDays: 0.5, pace: "relaxed" },
    next: "travel",
    assistant: STEP_ASSISTANT.travel,
  },
  {
    label: "1 天刚刚好",
    reply: "安排 1 天，节奏刚刚好。",
    patch: { durationDays: 1, pace: "standard" },
    next: "travel",
    assistant: STEP_ASSISTANT.travel,
  },
  {
    label: "2 天住一晚",
    reply: "安排 2 天，想住一晚，别太累。",
    patch: { durationDays: 2, pace: "relaxed" },
    next: "travel",
    assistant: STEP_ASSISTANT.travel,
  },
  {
    label: "2 天多看点",
    reply: "安排 2 天，可以稍微紧凑一点，多看几个地方。",
    patch: { durationDays: 2, pace: "compact" },
    next: "travel",
    assistant: STEP_ASSISTANT.travel,
  },
  {
    label: "3 天深度游",
    reply: "安排 3 天，想看得更完整。",
    patch: { durationDays: 3, pace: "standard" },
    next: "travel",
    assistant: STEP_ASSISTANT.travel,
  },
];

const TRAVEL_REPLIES: QuickReply[] = [
  {
    label: "公共交通 + 朋友",
    reply: "我和朋友一起，主要坐公共交通。",
    patch: { transportMode: "public", companions: ["friends"] },
    next: "ready",
    assistant: STEP_ASSISTANT.ready,
  },
  {
    label: "打车 + 父母",
    reply: "我带父母，尽量打车，少走路。",
    patch: {
      transportMode: "taxi",
      companions: ["parents"],
      pace: "relaxed",
      constraints: ["少走路"],
    },
    next: "ready",
    assistant: STEP_ASSISTANT.ready,
  },
  {
    label: "自驾 + 家人",
    reply: "我们一家人自驾出行。",
    patch: { transportMode: "self-drive", companions: ["family"] },
    next: "ready",
    assistant: STEP_ASSISTANT.ready,
  },
  {
    label: "一个人步行为主",
    reply: "我一个人，想以步行和慢逛为主。",
    patch: {
      transportMode: "walk-first",
      companions: ["solo"],
      pace: "relaxed",
      interests: ["citywalk", "food", "history"],
    },
    next: "ready",
    assistant: STEP_ASSISTANT.ready,
  },
];

function createMessage(role: Message["role"], content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function uniqueList<T>(items: T[]) {
  return [...new Set(items)];
}

function splitConstraints(text: string) {
  return text
    .split(/[，,。；;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function inferPreferences(text: string): Partial<Preferences> {
  const patch: Partial<Preferences> = {};
  const interests: Preferences["interests"] = [];
  const foodPreferences: Preferences["foodPreferences"] = [];
  const constraints: string[] = [];

  if (/半天|上午|下午/.test(text)) {
    patch.durationDays = 0.5;
  } else if (/三天|3天|三日|3日/.test(text)) {
    patch.durationDays = 3;
  } else if (/两天|2天|两日|2日|周末|住一晚/.test(text)) {
    patch.durationDays = 2;
  } else if (/一天|1天|一日|1日/.test(text)) {
    patch.durationDays = 1;
  }

  if (/自驾|开车/.test(text)) {
    patch.transportMode = "self-drive";
  } else if (/打车|出租|网约车/.test(text)) {
    patch.transportMode = "taxi";
  } else if (/步行|走路|慢逛|citywalk/i.test(text)) {
    patch.transportMode = "walk-first";
  } else if (/公交|公共交通|高铁|火车/.test(text)) {
    patch.transportMode = "public";
  }

  if (/父母|老人|长辈/.test(text)) {
    patch.companions = ["parents"];
    patch.pace = "relaxed";
  } else if (/孩子|小孩|亲子|一家|家人/.test(text)) {
    patch.companions = ["family"];
  } else if (/情侣|对象|伴侣/.test(text)) {
    patch.companions = ["couple"];
  } else if (/一个人|独自|自己/.test(text)) {
    patch.companions = ["solo"];
  } else if (/朋友|同学|同事/.test(text)) {
    patch.companions = ["friends"];
  }

  if (/历史|文化|成语|赵|古城|遗址|博物/.test(text)) {
    interests.push("history");
  }
  if (/美食|吃|小吃|特色|夜市/.test(text)) {
    interests.push("food");
  }
  if (/山|湖|自然|太行|京娘湖|东太行/.test(text)) {
    interests.push("mountain");
  }
  if (/太极|广府/.test(text)) {
    interests.push("taiji");
  }
  if (/红色|129|一二九/.test(text)) {
    interests.push("red");
  }
  if (/拍照|出片|摄影|打卡/.test(text)) {
    interests.push("photo");
  }
  if (/街区|citywalk|散步|慢逛/.test(text)) {
    interests.push("citywalk");
  }

  if (interests.length) {
    patch.interests = uniqueList(interests);
  }

  if (/不吃辣|不要辣|不能吃辣/.test(text)) {
    foodPreferences.push("non-spicy");
  } else if (/辣|能吃辣/.test(text)) {
    foodPreferences.push("spicy");
  }
  if (/清淡/.test(text)) {
    foodPreferences.push("light");
  }
  if (/特色|本地|地道|小吃/.test(text)) {
    foodPreferences.push("local-specialty");
  }
  if (foodPreferences.length) {
    patch.foodPreferences = uniqueList(foodPreferences);
  }

  if (/轻松|慢|少走|不累|休闲/.test(text)) {
    patch.pace = "relaxed";
    constraints.push("少走路");
  } else if (/紧凑|多看|多安排|丰富/.test(text)) {
    patch.pace = "compact";
  }

  if (/省钱|便宜|预算低|控制预算/.test(text)) {
    patch.budgetLevel = "low";
  } else if (/舒适|高一点|预算充足/.test(text)) {
    patch.budgetLevel = "high";
  }

  patch.constraints = uniqueList([...constraints, ...splitConstraints(text)]).slice(0, 6);

  return patch;
}

function getQuickReplies(step: Step) {
  if (step === "focus") {
    return FOCUS_REPLIES;
  }

  if (step === "schedule") {
    return SCHEDULE_REPLIES;
  }

  if (step === "travel") {
    return TRAVEL_REPLIES;
  }

  return [];
}

function mergePreferences(current: Preferences, patch: Partial<Preferences>): Preferences {
  return {
    ...current,
    ...patch,
    constraints: uniqueList([
      ...current.constraints,
      ...(patch.constraints ?? []),
    ]).slice(0, 8),
    interests: patch.interests ?? current.interests,
    foodPreferences: patch.foodPreferences ?? current.foodPreferences,
  };
}

function buildOriginalQuery(messages: Message[], preferences: Preferences) {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");

  return userMessages || preferences.originalQuery;
}

export function PlanForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [messages, setMessages] = useState<Message[]>([
    createMessage("assistant", STEP_ASSISTANT.intro),
  ]);
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamEvents, setStreamEvents] = useState<PlanStreamProgress[]>([]);

  const quickReplies = getQuickReplies(step);
  const canGenerate = step === "ready";
  const streamPreview = streamEvents.find((event) => event.preview)?.preview;

  function advanceFromText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const patch = inferPreferences(trimmed);
    const nextStep =
      step === "intro"
        ? "focus"
        : step === "focus"
          ? "schedule"
          : step === "schedule"
            ? "travel"
            : "ready";
    const assistant =
      nextStep === "ready"
        ? STEP_ASSISTANT.ready
        : STEP_ASSISTANT[nextStep];

    setMessages((current) => [
      ...current,
      createMessage("user", trimmed),
      createMessage("assistant", assistant),
    ]);
    setPreferences((current) =>
      mergePreferences(current, {
        ...patch,
        originalQuery:
          current.originalQuery === DEFAULT_PREFERENCES.originalQuery
            ? trimmed
            : current.originalQuery,
      }),
    );
    setStep(nextStep);
    setInputValue("");
    setError(null);
  }

  function handleQuickReply(reply: QuickReply) {
    setMessages((current) => [
      ...current,
      createMessage("user", reply.reply),
      createMessage("assistant", reply.assistant),
    ]);
    setPreferences((current) => mergePreferences(current, reply.patch));
    setStep(reply.next);
    setError(null);
  }

  async function handleGenerate() {
    setError(null);
    setStreamEvents([]);
    setIsSubmitting(true);

    try {
      const nextPreferences = {
        ...preferences,
        originalQuery: buildOriginalQuery(messages, preferences),
      };
      const payload = {
        intent: planIntentSchema.parse(nextPreferences),
      };
      const result = await generatePlanStream(payload, (event) => {
        setStreamEvents((current) => [...current.slice(-5), event]);
      });

      startTransition(() => {
        router.push(`/plan?share=${result.shareId}`);
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "生成路线失败，请稍后再试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="planner-shell mx-auto w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/38 bg-[#fbfaf7]/88 text-[#1d221e] shadow-[0_34px_110px_rgba(20,18,15,0.28)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      <div className="relative flex items-center justify-between border-b border-[#e6ded1]/80 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-full bg-[#1f2722] text-white shadow-[0_12px_32px_rgba(31,39,34,0.28)]">
            <span className="absolute inset-0 rounded-full border border-white/25" />
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">告诉我想怎么玩</p>
            <p className="text-xs text-[#7a6a5d]">像聊天一样，把路线慢慢聊出来</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#dfd4c3] bg-[#efe8dd]/80 px-3 py-1.5 text-xs text-[#6f5e51] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7e986d]" />
          {canGenerate ? "可以安排行程" : "继续聊聊"}
        </span>
      </div>

      <div className="relative max-h-[430px] space-y-4 overflow-y-auto px-5 py-5 md:px-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-in flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
                message.role === "user"
                  ? "bg-[#1f2722] text-white shadow-[0_14px_30px_rgba(31,39,34,0.18)]"
                  : "border border-[#e5dfd6] bg-white/92 text-[#3f3a33]"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {quickReplies.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickReplies.map((reply) => (
              <button
                key={reply.label}
                type="button"
                onClick={() => handleQuickReply(reply)}
                disabled={isSubmitting}
                className="group rounded-full border border-[#d7cec0] bg-white/88 px-4 py-2 text-sm text-[#4e4941] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#8f7d61] hover:bg-[#f7f0e5] hover:shadow-md"
              >
                <span className="inline-flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-[#9b8057] transition group-hover:rotate-12" />
                  {reply.label}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative border-t border-[#e5dfd6] bg-white/78 p-4 md:p-5">
        <form
          className="flex items-end gap-3 rounded-[28px] border border-[#d8cebf] bg-[#fbfaf7]/92 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
          onSubmit={(event) => {
            event.preventDefault();
            advanceFromText(inputValue);
          }}
        >
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={isSubmitting}
            rows={2}
            className="min-h-14 flex-1 resize-none rounded-[22px] border-0 bg-transparent px-4 py-3 text-sm leading-6 outline-none placeholder:text-[#94877a]"
            placeholder="比如：周末两天，想看历史和美食，轻松一点。"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1f2722] text-white shadow-[0_16px_32px_rgba(31,39,34,0.22)] transition hover:-translate-y-0.5 hover:bg-[#2e3832]"
            aria-label="发送"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {step === "intro"
              ? quickPrompts.slice(0, 2).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => advanceFromText(prompt)}
                    className="rounded-full border border-[#ddd4c8] bg-[#faf8f4]/90 px-3 py-1.5 text-xs text-[#626056] transition hover:-translate-y-0.5 hover:border-[#8f7d61] hover:bg-white"
                  >
                    {prompt}
                  </button>
                ))
              : null}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isSubmitting}
            className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-[#1f2722] px-5 py-3 text-sm font-medium text-[#f7f5f1] shadow-[0_18px_36px_rgba(31,39,34,0.2)] transition hover:-translate-y-0.5 hover:bg-[#2e3832] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            安排我的路线
          </button>
        </div>

        {isSubmitting || streamEvents.length ? (
          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#ded4c5] bg-[#f9f4ea] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1f2722]">
              <LoaderCircle
                className={`h-4 w-4 ${isSubmitting ? "animate-spin" : ""}`}
              />
              正在安排行程
            </div>
            <div className="mt-3 space-y-2">
              {streamEvents.map((event, index) => (
                <div
                  key={`${event.stage}-${index}-${event.message}`}
                  className="message-in rounded-2xl border border-white/70 bg-white/72 px-3 py-2 text-sm leading-6 text-[#5f5045]"
                >
                  {event.message}
                </div>
              ))}
            </div>

            {streamPreview ? (
              <div className="mt-4 rounded-[20px] border border-[#eadfd2] bg-white/84 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8b765b]">
                  先看一眼
                </p>
                <h3 className="mt-2 font-serif text-xl text-[#21170f]">
                  {streamPreview.tripTitle}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#665f55]">
                  {streamPreview.summary}
                </p>
                <div className="mt-3 space-y-2">
                  {streamPreview.days.map((day) => (
                    <p
                      key={day.dayIndex}
                      className="text-xs leading-6 text-[#7a6a5d]"
                    >
                      第 {day.dayIndex} 天：{day.theme}
                      {day.stops.length ? ` · ${day.stops.join(" / ")}` : ""}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-[#a43f35]">{error}</p> : null}
      </div>
    </section>
  );
}
