import {
  ArrowRight,
  Bot,
  CalendarDays,
  Camera,
  Compass,
  MapPinned,
  Mountain,
  Sparkles,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PlanForm } from "../components/plan-form";
import {
  featuredPois,
  foodCatalog,
  routeTemplates,
  siteThemes,
} from "../lib/content";

const heroStats = [
  ["10+", "逛法参考"],
  ["30+", "景点美食"],
  ["实时", "语音问路"],
];

const serviceCards = [
  {
    title: "景点图鉴",
    text: "先看看邯郸有哪些值得停下来的地方。",
    icon: MapPinned,
  },
  {
    title: "主题路线",
    text: "半天、一日、周末，都能找到合适的游玩节奏。",
    icon: Compass,
  },
  {
    title: "本地风味",
    text: "正餐、小吃、伴手礼尽量顺路安排，不为吃饭来回折返。",
    icon: Utensils,
  },
  {
    title: "语音导游",
    text: "不知道怎么走、哪里好吃，直接开口问就行。",
    icon: Bot,
  },
];

const travelMoments = [
  {
    label: "历史地标",
    title: "从丛台出发，读懂赵都的第一段故事",
    image: "/images/poi/congtai.jpg",
  },
  {
    label: "古城慢游",
    title: "在广府古城，把水城、太极和烟火气连起来",
    image: "/images/poi/guangfu.jpg",
  },
  {
    label: "山水周末",
    title: "去京娘湖和东太行，给周末留一点开阔",
    image: "/images/poi/jingnianghu.jpg",
  },
];

const atlasPois = featuredPois.slice(0, 4);
const atlasFoods = foodCatalog.filter((item) => item.image).slice(0, 4);
const displayThemes = siteThemes.slice(0, 6);

function PlannerSection() {
  return (
    <section id="planner" className="planner-section px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:items-start">
        <div className="rounded-[36px] border border-white/20 bg-[#171a16]/88 p-8 text-white shadow-[0_30px_90px_rgba(34,26,16,0.18)] backdrop-blur-2xl">
          <div className="section-kicker text-[#d9b077]">智能安排行程</div>
          <h2 className="zh-heading mt-5 font-serif text-[clamp(2.35rem,6vw,3rem)] leading-[1.06] tracking-[-0.05em]">
            <span className="zh-line">先说你想怎么玩，</span>
            <span className="zh-line text-white/72">我来帮你排路线。</span>
          </h2>
          <p className="mt-6 text-sm leading-7 text-white/68">
            告诉我什么时候来、和谁来、想看什么，我会把时间、路程和吃饭一起安排好。
          </p>
          <Link
            href="/guide"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#171a16] transition hover:-translate-y-0.5"
          >
            去 AI 导游页选择 <Bot className="h-4 w-4" />
          </Link>
        </div>
        <PlanForm />
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="home-shell overflow-hidden">
      <section className="official-hero relative min-h-[calc(100svh-84px)]">
        <div className="hero-halo hero-halo-one" />
        <div className="hero-halo hero-halo-two" />

        <div className="mx-auto grid min-h-[calc(100svh-84px)] max-w-7xl items-center gap-12 px-5 py-14 md:px-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)] xl:py-20">
          <div className="relative z-10 max-w-3xl">
            <p className="fade-up text-xs font-semibold uppercase tracking-[0.44em] text-[#8b765b]">
              HANDAN CULTURAL TOURISM
            </p>
            <h1 className="fade-up delay-1 mt-6 font-serif text-[clamp(3.4rem,8vw,8.7rem)] leading-[0.92] tracking-[-0.08em] text-[#171915]">
              邯郸，
              <span className="block">一城故事</span>
              <span className="block text-[#8c5d2d]">一路好走</span>
            </h1>
            <p className="fade-up delay-2 mt-7 max-w-2xl text-base leading-8 text-[#5d564b] md:text-lg">
              从赵都遗址、成语典故到街巷烟火，把景点、美食、节奏和交通一起想清楚。
              第一次来不知道先去哪里，也可以先问一句，让行程从容一点。
            </p>

            <div className="fade-up delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/guide"
                className="shine-button inline-flex items-center justify-center gap-2 rounded-full bg-[#171915] px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_55px_rgba(23,25,21,0.22)] transition hover:-translate-y-0.5 hover:bg-[#2b2d28]"
              >
                和 AI 导游聊聊
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#routes"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9c8b0] bg-white/64 px-6 py-3 text-sm font-semibold text-[#2f2a23] shadow-[0_16px_40px_rgba(67,51,29,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                浏览推荐路线
                <Compass className="h-4 w-4" />
              </Link>
            </div>

            <div className="fade-up delay-3 mt-11 grid max-w-xl grid-cols-3 divide-x divide-[#d8cbb9] border-y border-[#d8cbb9] py-5">
              {heroStats.map(([value, label]) => (
                <div key={label} className="px-4 first:pl-0">
                  <p className="font-serif text-3xl leading-none text-[#181a16] md:text-4xl">
                    {value}
                  </p>
                  <p className="mt-2 text-xs tracking-[0.22em] text-[#88796a]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-gallery fade-up delay-2 relative z-10">
            <div className="hero-gallery-main">
              <Image
                src="/hero/user-handan-hero.jpg"
                alt="邯郸古城氛围主视觉"
                width={960}
                height={640}
                priority
                className="h-full w-full object-cover"
              />
              <div className="hero-gallery-label">
                <span>今日推荐</span>
                <strong>古城慢行 · 风味入夜</strong>
              </div>
            </div>

            <div className="hero-floating-card">
              <p className="text-xs uppercase tracking-[0.26em] text-[#a28b67]">
                TRAVEL HELP
              </p>
              <p className="mt-3 font-serif text-2xl leading-tight text-[#1e211c]">
                先问一句，
                <span className="block">再决定怎么走。</span>
              </p>
              <Link
                href="/guide"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7b532c]"
              >
                打开 AI 导游 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="hero-mini-card">
              <CalendarDays className="h-5 w-5 text-[#906a39]" />
              <div>
                <p className="text-sm font-semibold text-[#1d221e]">适合临时起意</p>
                <p className="mt-1 text-xs text-[#746b5d]">半天、一日、住一晚都能开始</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlannerSection />

      <section className="official-notice border-y border-[#ddd2c1] bg-[#fffaf1]/72">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-sm text-[#5f584c] md:flex-row md:items-center md:justify-between md:px-8">
          <p className="font-semibold text-[#1d221e]">游客服务提示</p>
          <p className="leading-7">
            第一次来邯郸，可优先选择“成语文化 + 市区美食”方向；带父母或孩子建议选择轻松节奏。
          </p>
          <Link href="/faq" className="inline-flex items-center gap-1 font-semibold text-[#835d35]">
            查看常见问题 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="section-kicker">文旅服务</div>
        <div className="mt-5 grid gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-end">
          <h2 className="zh-heading font-serif text-[clamp(2.45rem,6vw,3.75rem)] leading-[1.06] tracking-[-0.05em] text-[#1d221e]">
            <span className="zh-line">想看什么、吃什么，</span>
            <span className="zh-line">先帮你理清楚。</span>
          </h2>
          <p className="max-w-2xl text-base leading-8 text-[#675f54] md:text-lg">
            看历史可以从丛台和赵王城开始，想慢慢逛可以去广府古城，
            晚上想吃点本地味道，也能顺着街区一路安排。
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="service-tile fade-up rounded-[30px] border border-[#e0d4c2] bg-white/72 p-6 shadow-[0_24px_70px_rgba(63,47,28,0.08)] backdrop-blur-xl"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#efe3d1] text-[#744b26]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-7 font-serif text-2xl text-[#1d221e]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#675f54]">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="routes" className="bg-[#151815] px-5 py-20 text-white md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-kicker text-[#d9b077]">推荐路线</div>
              <h2 className="zh-heading mt-5 font-serif text-[clamp(2.45rem,6vw,3.75rem)] leading-[1.06] tracking-[-0.05em]">
                <span className="zh-line">不知道怎么排，</span>
                <span className="zh-line text-white/72">先从这三条路线开始。</span>
              </h2>
            </div>
            <Link
              href="#planner"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white hover:text-[#151815]"
            >
              让 AI 帮我细排 <Sparkles className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {routeTemplates.map((route, index) => (
              <Link
                key={route.slug}
                href={`/routes/${route.slug}`}
                className="route-card group relative min-h-[360px] overflow-hidden rounded-[34px] border border-white/12 bg-white/[0.06] p-7 transition duration-500 hover:-translate-y-1 hover:bg-white/[0.1]"
              >
                <div className="absolute inset-0 opacity-30 transition duration-500 group-hover:opacity-60">
                  <div className="route-card-grid" />
                </div>
                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <p className="inline-flex rounded-full border border-white/14 px-3 py-1 text-xs tracking-[0.18em] text-white/62">
                      0{index + 1} · {route.duration}
                    </p>
                    <h3 className="mt-8 font-serif text-3xl leading-tight text-white">
                      {route.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-white/64">{route.summary}</p>
                  </div>
                  <div className="mt-10">
                    <div className="flex flex-wrap gap-2">
                      {route.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <p className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#eac07f]">
                      查看路线 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="atlas" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="xl:sticky xl:top-28 xl:self-start">
            <div className="section-kicker">邯郸图鉴</div>
            <h2 className="zh-heading mt-5 font-serif text-[clamp(2.45rem,6vw,3.75rem)] leading-[1.06] tracking-[-0.05em] text-[#1d221e]">
              <span className="zh-line">景点与味道，</span>
              <span className="zh-line">一起安排上。</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-[#675f54]">
              不只是看看有哪些地方，更重要的是知道先去哪、怎么串起来、在哪一顿吃得更顺。
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {atlasPois.map((poi, index) => (
              <Link
                key={poi.slug}
                href={`/poi/${poi.slug}`}
                className={`atlas-card group ${index === 1 ? "sm:mt-12" : ""}`}
              >
                <Image
                  src={poi.image ?? "/hero/user-handan-hero.jpg"}
                  alt={poi.name}
                  width={560}
                  height={680}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="atlas-card-caption">
                  <p>{poi.district}</p>
                  <h3>{poi.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f2eadc] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-kicker">主题玩法</div>
              <h2 className="zh-heading mt-5 font-serif text-[clamp(2.45rem,6vw,3.75rem)] leading-[1.06] tracking-[-0.05em] text-[#1d221e]">
                按兴趣逛邯郸。
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-[#675f54]">
              想听历史、看山水、逛街区，或者带家人轻松一点，都可以按自己的兴趣开始。
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayThemes.map((theme) => (
              <Link
                key={theme.slug}
                href={`/theme/${theme.slug}`}
                className="theme-tile group"
                style={{ backgroundImage: theme.heroImage }}
              >
                <div className="theme-tile-content">
                  <p>{theme.bullets[0]}</p>
                  <h3>{theme.name}</h3>
                  <span>
                    查看主题 <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="moment-stack">
            {travelMoments.map((moment, index) => (
              <article
                key={moment.title}
                className="moment-card"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Image
                  src={moment.image}
                  alt={moment.title}
                  width={720}
                  height={420}
                  className="h-full w-full object-cover"
                />
                <div>
                  <p>{moment.label}</p>
                  <h3>{moment.title}</h3>
                </div>
              </article>
            ))}
          </div>

          <div>
            <div className="section-kicker">旅行灵感</div>
            <h2 className="zh-heading mt-5 font-serif text-[clamp(2.45rem,6vw,3.75rem)] leading-[1.06] tracking-[-0.05em] text-[#1d221e]">
              <span className="zh-line">白天看故事，</span>
              <span className="zh-line">晚上吃烟火。</span>
            </h2>
            <p className="mt-6 text-base leading-8 text-[#675f54]">
              上午看古迹，下午慢慢走，晚上把小吃和热菜安排上。
              不用赶很多地方，也能把邯郸这一趟玩得有滋味。
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {atlasFoods.map((food) => (
                <Link
                  key={food.slug}
                  href={`/food/${food.slug}`}
                  className="food-chip group"
                >
                  <span>{food.district}</span>
                  <strong>{food.name}</strong>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="final-cta">
          <div>
            <p className="section-kicker text-[#d9b077]">开始出发</p>
            <h2 className="zh-heading mt-5 font-serif text-[clamp(2.45rem,6vw,3.75rem)] leading-[1.06] tracking-[-0.05em]">
              问一句，邯郸就近了。
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/guide" className="final-cta-button bg-white text-[#171a16]">
              打开 AI 导游 <Bot className="h-4 w-4" />
            </Link>
            <Link href="#atlas" className="final-cta-button border border-white/18 text-white">
              继续看图鉴 <Camera className="h-4 w-4" />
            </Link>
          </div>
          <Mountain className="final-cta-mark" />
        </div>
      </section>
    </div>
  );
}
