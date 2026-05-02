export type PoiCard = {
  id: string;
  slug: string;
  name: string;
  district: string;
  summary: string;
  intro: string;
  tags: string[];
  themeSlugs: string[];
  recommendStayMinutes: number;
  ticket: string;
  lat: number;
  lng: number;
  image?: string;
};

export type FoodCard = {
  id: string;
  slug: string;
  name: string;
  kind: "venue" | "dish";
  district: string;
  summary: string;
  intro: string;
  tags: string[];
  bestTimeToEat: string;
  avgPrice?: string;
  lat?: number;
  lng?: number;
  relatedVenueSlugs?: string[];
  image?: string;
};

export type ThemeCard = {
  slug: string;
  name: string;
  intro: string;
  heroImage: string;
  bullets: string[];
};

export type RouteTemplate = {
  slug: string;
  title: string;
  summary: string;
  duration: string;
  highlights: string[];
};

function buildHero(image: string, from: string, to: string) {
  return `linear-gradient(135deg, ${from}, ${to}), url('${image}')`;
}

const imageAssets = {
  poi: {
    wahegong: "/images/poi/wahegong.jpg",
    guangfu: "/images/poi/guangfu.jpg",
    congtai: "/images/poi/congtai.jpg",
    zhaoyuan: "/images/poi/zhaoyuan.jpg",
    zhaowangcheng: "/images/poi/zhaowangcheng.jpg",
    handandao: "/images/poi/handandao.jpg",
    headquarters129: "/images/poi/129-headquarters.jpg",
    jingnianghu: "/images/poi/jingnianghu.jpg",
    dongtaihang: "/images/poi/dongtaihang.jpg",
    xiangtangshan: "/images/poi/xiangtangshan.jpg",
  },
  food: {
    ermao: "/images/food/ermao.jpg",
    wubaiju: "/images/food/wubaiju.jpg",
    guobahuoshao: "/images/food/guobahuoshao.jpg",
    yongnian: "/images/food/yongnian.jpg",
    handandao: "/images/food/handandao-flavors.jpg",
    wuanGuokui: "/images/food/wuan-guokui.jpg",
    quzhouJianbing: "/images/food/quzhou-jianbing.jpg",
    fengfengThreePot: "/images/food/fengfeng-three-pot.png",
    linzhangSoup: "/images/food/linzhang-mutton-soup.jpg",
    damingShaomai: "/images/food/daming-shaomai.jpg",
  },
} as const;

export const siteThemes: ThemeCard[] = [
  {
    slug: "idiom-culture",
    name: "成语文化",
    intro: "先从赵都地标和城市记忆入手，会更容易理解邯郸为什么总让人想起成语典故。",
    heroImage: buildHero(imageAssets.poi.congtai, "rgba(28, 20, 16, 0.76)", "rgba(130, 95, 55, 0.28)"),
    bullets: ["第一次来很稳妥", "景点集中", "适合半日到两日"],
  },
  {
    slug: "zhao-culture",
    name: "赵文化 / 战国文化",
    intro: "如果你更想看遗址和赵都空间感，这条方向会更厚重，也更适合慢慢听故事。",
    heroImage: buildHero(
      imageAssets.poi.zhaowangcheng,
      "rgba(25, 20, 15, 0.78)",
      "rgba(132, 88, 56, 0.3)",
    ),
    bullets: ["遗址感更强", "适合历史爱好者", "讲解空间足"],
  },
  {
    slug: "taiji-culture",
    name: "太极文化",
    intro: "广府古城、水城气质和永年风味可以一起排进一条更松弛的周末线。",
    heroImage: buildHero(imageAssets.poi.guangfu, "rgba(26, 20, 14, 0.72)", "rgba(94, 106, 69, 0.28)"),
    bullets: ["古城氛围浓", "适合慢游", "很适合拍照"],
  },
  {
    slug: "red-culture",
    name: "红色文化",
    intro: "如果是带长辈、孩子或研学出行，涉县这一线会更有主题感，也更适合沉下来看。",
    heroImage: buildHero(
      imageAssets.poi.headquarters129,
      "rgba(46, 15, 16, 0.82)",
      "rgba(143, 60, 56, 0.26)",
    ),
    bullets: ["适合家庭和研学", "主题明确", "适合一天安排"],
  },
  {
    slug: "grotto-archaeology",
    name: "北朝石窟 / 考古遗址",
    intro: "想看邯郸更深一层的历史面貌，可以把石窟和遗址放在同一条线上读。",
    heroImage: buildHero(
      imageAssets.poi.xiangtangshan,
      "rgba(16, 17, 20, 0.8)",
      "rgba(92, 98, 104, 0.26)",
    ),
    bullets: ["更适合深度游", "摄影感强", "文物气质更足"],
  },
  {
    slug: "mountain-leisure",
    name: "山水休闲",
    intro: "不想一直看遗址的话，就把湖景、山脊和女娲文化一起排成一条更舒展的路线。",
    heroImage: buildHero(
      imageAssets.poi.jingnianghu,
      "rgba(12, 26, 30, 0.74)",
      "rgba(44, 117, 117, 0.26)",
    ),
    bullets: ["周末感很强", "适合自驾", "拍照友好"],
  },
  {
    slug: "citywalk",
    name: "市区慢游",
    intro: "半天也能逛得明白，从公园、遗址到街区，移动成本低，节奏也更可控。",
    heroImage: buildHero(
      imageAssets.poi.handandao,
      "rgba(20, 20, 22, 0.76)",
      "rgba(75, 77, 84, 0.26)",
    ),
    bullets: ["年轻人友好", "移动少", "适合临时起意"],
  },
  {
    slug: "night-food",
    name: "夜游美食",
    intro: "如果你只想把晚上用好，这条方向更适合边走边吃，把邯郸的夜里味道吃出来。",
    heroImage: buildHero(
      imageAssets.food.handandao,
      "rgba(18, 14, 21, 0.78)",
      "rgba(90, 66, 112, 0.24)",
    ),
    bullets: ["适合 4 到 6 小时", "更偏吃和逛", "氛围感强"],
  },
  {
    slug: "family-friendly",
    name: "亲子友好",
    intro: "这条方向会优先照顾休息、节奏和吃饭的舒适度，不会一味追求多跑几个点。",
    heroImage: buildHero(
      imageAssets.poi.zhaoyuan,
      "rgba(26, 23, 16, 0.72)",
      "rgba(140, 112, 60, 0.24)",
    ),
    bullets: ["更稳更慢", "更在意休息点", "适合带孩子"],
  },
  {
    slug: "senior-friendly",
    name: "老人友好",
    intro: "如果是陪父母或长辈，优先保留最值得去的核心体验，同时尽量少折腾。",
    heroImage: buildHero(
      imageAssets.poi.congtai,
      "rgba(28, 19, 14, 0.7)",
      "rgba(126, 93, 62, 0.22)",
    ),
    bullets: ["步行压力更低", "适合一日游", "中转更稳妥"],
  },
];

export const featuredPois: PoiCard[] = [
  {
    id: "poi-wahegong",
    slug: "wahegong",
    name: "娲皇宫",
    district: "涉县",
    summary: "如果想把山景和人文放在一条线上，娲皇宫会是很有记忆点的一站。",
    intro: "悬空古建和女娲文化都在这里，适合安排成涉县或山水主题线里的主景点。",
    tags: ["山水", "女娲文化", "历史", "拍照"],
    themeSlugs: ["mountain-leisure", "zhao-culture"],
    recommendStayMinutes: 180,
    ticket: "约 80 元",
    lat: 36.556,
    lng: 113.695,
    image: imageAssets.poi.wahegong,
  },
  {
    id: "poi-guangfu",
    slug: "guangfu-ancient-city",
    name: "广府古城",
    district: "永年区",
    summary: "古城、水城、太极这三种感觉，在广府最容易一下子串起来。",
    intro: "很适合周末慢游，既能走古城，也能把永年一带的风味自然接进来。",
    tags: ["太极", "古城", "拍照", "夜游"],
    themeSlugs: ["taiji-culture", "citywalk", "night-food"],
    recommendStayMinutes: 180,
    ticket: "约 70 元",
    lat: 36.702,
    lng: 114.735,
    image: imageAssets.poi.guangfu,
  },
  {
    id: "poi-congtai",
    slug: "congtai-park",
    name: "丛台公园",
    district: "丛台区",
    summary: "第一次来邯郸，从丛台开始最容易把整座城的历史感接上。",
    intro: "它适合作为市区路线的第一站，后面无论接街区还是接吃饭都很顺。",
    tags: ["历史", "市区", "成语文化", "老人友好"],
    themeSlugs: ["idiom-culture", "citywalk", "senior-friendly"],
    recommendStayMinutes: 90,
    ticket: "免费或低价",
    lat: 36.612,
    lng: 114.489,
    image: imageAssets.poi.congtai,
  },
  {
    id: "poi-zhaoyuan",
    slug: "zhaoyuan-park",
    name: "赵苑公园",
    district: "复兴区",
    summary: "如果想让市区路线更舒展一点，赵苑公园是很合适的缓冲段。",
    intro: "这类公园型点位适合留给带老人、孩子，或者只想轻松逛的人。",
    tags: ["公园", "市区", "亲子", "老人友好"],
    themeSlugs: ["citywalk", "family-friendly", "senior-friendly"],
    recommendStayMinutes: 75,
    ticket: "免费",
    lat: 36.619,
    lng: 114.447,
    image: imageAssets.poi.zhaoyuan,
  },
  {
    id: "poi-zhaowangcheng",
    slug: "zhaowangcheng-site",
    name: "赵王城国家考古遗址公园",
    district: "邯山区",
    summary: "想把赵文化真正“看见”，赵王城的遗址现场感会比单听故事更有说服力。",
    intro: "这里更适合安排给历史爱好者，或和丛台一起拼成更完整的赵都路线。",
    tags: ["遗址", "赵文化", "考古", "拍照"],
    themeSlugs: ["zhao-culture", "grotto-archaeology", "idiom-culture"],
    recommendStayMinutes: 120,
    ticket: "免费或低价",
    lat: 36.581,
    lng: 114.493,
    image: imageAssets.poi.zhaowangcheng,
  },
  {
    id: "poi-handandao",
    slug: "handan-road-block",
    name: "邯郸道历史文化街区",
    district: "丛台区",
    summary: "夜里想边逛边吃，最后大多都会收在邯郸道这类街区里。",
    intro: "它很适合做半日线和夜游线的收尾，走起来热闹，也更容易出片。",
    tags: ["街区", "夜游", "美食", "拍照"],
    themeSlugs: ["citywalk", "night-food", "idiom-culture"],
    recommendStayMinutes: 120,
    ticket: "免费",
    lat: 36.608,
    lng: 114.492,
    image: imageAssets.poi.handandao,
  },
  {
    id: "poi-129",
    slug: "129-headquarters",
    name: "八路军一二九师司令部旧址",
    district: "涉县",
    summary: "如果是陪长辈、带孩子或想认真看一段近现代历史，这里很值得单独留时间。",
    intro: "红色文化线里最核心的点位之一，更适合把讲解和停留时间留足。",
    tags: ["红色文化", "研学", "历史", "家庭"],
    themeSlugs: ["red-culture", "family-friendly", "senior-friendly"],
    recommendStayMinutes: 120,
    ticket: "免费或低价",
    lat: 36.537,
    lng: 113.673,
    image: imageAssets.poi.headquarters129,
  },
  {
    id: "poi-jingnianghu",
    slug: "jingniang-lake",
    name: "京娘湖",
    district: "武安市",
    summary: "周末想看点舒展的山水，京娘湖会比城市景点更容易让人慢下来。",
    intro: "湖景视野很开，适合安排在山水线里做一整段主景，而不是匆匆路过。",
    tags: ["山水", "湖景", "拍照", "自然"],
    themeSlugs: ["mountain-leisure"],
    recommendStayMinutes: 180,
    ticket: "约 120 元",
    lat: 36.543,
    lng: 113.878,
    image: imageAssets.poi.jingnianghu,
  },
  {
    id: "poi-dongtaihang",
    slug: "dongtaihang",
    name: "东太行",
    district: "武安市",
    summary: "如果你更想看山脊、栈道和大开大合的视野，东太行会更痛快。",
    intro: "它更适合精力比较足的周末线，最好和武安当地的面点补给一起安排。",
    tags: ["山水", "登山", "拍照", "高强度"],
    themeSlugs: ["mountain-leisure"],
    recommendStayMinutes: 210,
    ticket: "约 150 元",
    lat: 36.649,
    lng: 113.819,
    image: imageAssets.poi.dongtaihang,
  },
  {
    id: "poi-xiangtangshan",
    slug: "xiangtangshan-grottoes",
    name: "响堂山石窟",
    district: "峰峰矿区",
    summary: "它能把邯郸的历史面再往深处带一步，不只停留在赵文化。",
    intro: "如果你对石窟、造像和考古感兴趣，这里会是很有分量的一站。",
    tags: ["石窟", "考古", "历史", "摄影"],
    themeSlugs: ["grotto-archaeology", "zhao-culture"],
    recommendStayMinutes: 150,
    ticket: "约 50 元",
    lat: 36.424,
    lng: 114.138,
    image: imageAssets.poi.xiangtangshan,
  },
];

export const foodCatalog: FoodCard[] = [
  {
    id: "food-ermao",
    slug: "ermao-roast-chicken",
    name: "二毛烧鸡",
    kind: "venue",
    district: "大名县",
    summary: "第一次来邯郸，很多人会先记住二毛烧鸡这一口。",
    intro: "它既适合正餐，也适合顺手带走做伴手礼，是地方辨识度很高的一味。",
    tags: ["名吃", "熟食", "伴手礼"],
    bestTimeToEat: "午餐 / 晚餐",
    avgPrice: "约 58 元",
    lat: 36.283,
    lng: 115.153,
    image: imageAssets.food.ermao,
  },
  {
    id: "food-wubaiju",
    slug: "wubaiju-sausage",
    name: "五百居香肠",
    kind: "venue",
    district: "大名县",
    summary: "如果你喜欢熟食和地方风味，五百居香肠很容易留下记忆点。",
    intro: "适合和大名一带的熟食、烧麦一起排，吃法上也更灵活。",
    tags: ["名吃", "传统风味", "伴手礼"],
    bestTimeToEat: "午餐 / 晚餐",
    avgPrice: "约 42 元",
    lat: 36.284,
    lng: 115.148,
    image: imageAssets.food.wubaiju,
  },
  {
    id: "food-guobahuoshao",
    slug: "guoba-huoshao",
    name: "郭八火烧",
    kind: "venue",
    district: "丛台区",
    summary: "在邯郸市区边走边逛时，郭八火烧是顺手就能吃到、又很本地的小吃。",
    intro: "路线排得紧的时候，它很适合做中途补给，不会打断整条线的节奏。",
    tags: ["小吃", "快食", "夜游"],
    bestTimeToEat: "早餐 / 午后补给",
    avgPrice: "约 25 元",
    lat: 36.607,
    lng: 114.495,
    image: imageAssets.food.guobahuoshao,
  },
  {
    id: "food-yongnian",
    slug: "yongnian-donkey-sausage",
    name: "永年驴肉香肠",
    kind: "venue",
    district: "永年区",
    summary: "去广府古城时，把永年驴肉香肠一起吃掉，这条线会完整很多。",
    intro: "它和古城慢游的搭配很自然，也更适合家庭或轻松周末线。",
    tags: ["太极文化", "名吃", "古城风味"],
    bestTimeToEat: "午餐 / 晚餐",
    avgPrice: "约 38 元",
    lat: 36.695,
    lng: 114.739,
    image: imageAssets.food.yongnian,
  },
  {
    id: "food-handandao",
    slug: "handan-road-flavors",
    name: "邯郸道风味集合",
    kind: "venue",
    district: "丛台区",
    summary: "如果你只想用一个晚上把几样邯郸味道吃个大概，街区风味集合最省心。",
    intro: "更适合夜游线收尾，不用再为了找不同小吃来回跑。",
    tags: ["街区", "夜游", "集合店"],
    bestTimeToEat: "傍晚 / 夜间",
    avgPrice: "约 48 元",
    lat: 36.608,
    lng: 114.493,
    image: imageAssets.food.handandao,
  },
  {
    id: "food-wuan-guokui",
    slug: "wuan-guokui-stores",
    name: "武安锅盔门店集合",
    kind: "venue",
    district: "武安市",
    summary: "山水线里需要一个顶饿又有地方感的补给点，锅盔往往最稳。",
    intro: "它很适合接在京娘湖、东太行这种路线里，吃起来简单，但很有地方气。",
    tags: ["武安", "小吃", "山水线路补给"],
    bestTimeToEat: "午餐 / 下午",
    avgPrice: "约 22 元",
    lat: 36.696,
    lng: 114.202,
    image: imageAssets.food.wuanGuokui,
  },
  {
    id: "food-fengfeng",
    slug: "fengfeng-three-pot",
    name: "峰峰三下锅体验店集合",
    kind: "venue",
    district: "峰峰矿区",
    summary: "如果白天看了石窟或矿区线，晚上用三下锅收尾会很有地方感。",
    intro: "它更偏热菜和聚餐感，适合半日线或一日线的晚饭场景。",
    tags: ["地方菜", "热食", "晚餐"],
    bestTimeToEat: "晚餐",
    avgPrice: "约 56 元",
    lat: 36.419,
    lng: 114.205,
    image: imageAssets.food.fengfengThreePot,
  },
  {
    id: "dish-guoba",
    slug: "guoba-huoshao-dish",
    name: "郭八火烧",
    kind: "dish",
    district: "丛台区",
    summary: "它最适合塞进边走边逛的路线里，吃起来快，也很有本地辨识度。",
    intro: "如果你不想正餐坐太久，郭八火烧这类小吃就很适合接在景点之间。",
    tags: ["小吃", "快食", "市区慢游"],
    bestTimeToEat: "早餐 / 午后补给",
    relatedVenueSlugs: ["guoba-huoshao", "handan-road-flavors"],
    image: imageAssets.food.guobahuoshao,
  },
  {
    id: "dish-quzhou",
    slug: "quzhou-jianbing-soup",
    name: "曲周煎饼汤",
    kind: "dish",
    district: "曲周县",
    summary: "偏热乎、偏家常，适合作为早餐或轻正餐来安排。",
    intro: "如果你更喜欢清爽一点、暖胃一点的口味，曲周煎饼汤会比重口味更舒服。",
    tags: ["早餐", "汤食", "地方名吃"],
    bestTimeToEat: "早餐",
    relatedVenueSlugs: ["handan-road-flavors"],
    image: imageAssets.food.quzhouJianbing,
  },
  {
    id: "dish-wuan",
    slug: "wuan-guokui-dish",
    name: "武安锅盔",
    kind: "dish",
    district: "武安市",
    summary: "耐饿、带麦香，很适合爬山或长距离移动前后垫一口。",
    intro: "这类面点和山水线的节奏很搭，不会太拖，也不会吃得没存在感。",
    tags: ["面点", "地方名吃", "耐饿"],
    bestTimeToEat: "午餐 / 下午",
    relatedVenueSlugs: ["wuan-guokui-stores"],
    image: imageAssets.food.wuanGuokui,
  },
  {
    id: "dish-linzhang",
    slug: "linzhang-mutton-soup",
    name: "临漳羊汤",
    kind: "dish",
    district: "临漳县",
    summary: "如果你更在意热汤和舒服感，临漳羊汤会是很稳的一碗。",
    intro: "带父母、长辈或偏爱热食的人，通常会更喜欢这种暖胃的安排。",
    tags: ["汤食", "地方名吃", "热食"],
    bestTimeToEat: "早餐 / 午餐",
    image: imageAssets.food.linzhangSoup,
  },
  {
    id: "dish-fengfeng",
    slug: "fengfeng-three-pot-dish",
    name: "峰峰三下锅",
    kind: "dish",
    district: "峰峰矿区",
    summary: "这道菜更厚实，也更适合作为一条专题线最后的正餐压轴。",
    intro: "如果白天走得多，晚上安排三下锅会比继续吃小吃更有满足感。",
    tags: ["热菜", "地方风味", "晚餐"],
    bestTimeToEat: "晚餐",
    relatedVenueSlugs: ["fengfeng-three-pot"],
    image: imageAssets.food.fengfengThreePot,
  },
  {
    id: "dish-daming",
    slug: "daming-shaomai",
    name: "大名烧麦",
    kind: "dish",
    district: "大名县",
    summary: "和熟食、汤食一起搭着吃，会比单独吃更有地方早餐的味道。",
    intro: "大名这一线如果想吃得更地道，大名烧麦是很值得加进来的那一口。",
    tags: ["面点", "早餐", "地方名吃"],
    bestTimeToEat: "早餐 / 午餐",
    relatedVenueSlugs: ["wubaiju-sausage"],
    image: imageAssets.food.damingShaomai,
  },
  {
    id: "dish-ermao",
    slug: "ermao-roast-chicken-dish",
    name: "二毛烧鸡",
    kind: "dish",
    district: "大名县",
    summary: "如果只挑一道最有代表性的熟食来记住邯郸，很多人会想到它。",
    intro: "它适合做第一顿邯郸味道，也适合顺手带走，使用场景很灵活。",
    tags: ["熟食", "伴手礼", "名吃"],
    bestTimeToEat: "午餐 / 晚餐",
    relatedVenueSlugs: ["ermao-roast-chicken"],
    image: imageAssets.food.ermao,
  },
  {
    id: "dish-wubaiju",
    slug: "wubaiju-sausage-dish",
    name: "五百居香肠",
    kind: "dish",
    district: "大名县",
    summary: "它更偏熟食拼盘那一类，适合做一条大名风味线的补充。",
    intro: "如果你喜欢地方熟食，五百居香肠和烧麦、烧鸡放在一起会更完整。",
    tags: ["熟食", "地方名吃"],
    bestTimeToEat: "午餐 / 晚餐",
    relatedVenueSlugs: ["wubaiju-sausage"],
    image: imageAssets.food.wubaiju,
  },
  {
    id: "dish-yongnian",
    slug: "yongnian-donkey-sausage-dish",
    name: "永年驴肉香肠",
    kind: "dish",
    district: "永年区",
    summary: "太极古城线里，这类熟食风味很容易留下地域记忆。",
    intro: "它更适合广府古城附近的慢节奏安排，不用专门绕远也能吃到。",
    tags: ["熟食", "太极文化线", "地方名吃"],
    bestTimeToEat: "午餐 / 晚餐",
    relatedVenueSlugs: ["yongnian-donkey-sausage"],
    image: imageAssets.food.yongnian,
  },
  {
    id: "dish-chantu",
    slug: "jinan-greedy-rabbit",
    name: "冀南馋兔",
    kind: "dish",
    district: "邯山区",
    summary: "更适合偏爱香辣口味、想把本地小吃吃得更野一点的人。",
    intro: "这类味道更偏加餐和夜间小聚，适合作为追加项，而不是整条线的主餐。",
    tags: ["地方小吃", "佐餐", "香辣"],
    bestTimeToEat: "晚餐 / 夜间",
  },
];

export const routeTemplates: RouteTemplate[] = [
  {
    slug: "historic-weekend",
    title: "邯郸两日历史文化线",
    summary: "适合第一次来邯郸，先看核心文化地标，再用几样地方名吃把这趟路吃完整。",
    duration: "2 天 1 夜",
    highlights: ["丛台公园", "赵王城遗址", "邯郸道夜游", "郭八火烧"],
  },
  {
    slug: "guangfu-slow-day",
    title: "广府古城慢游半日线",
    summary: "更松弛，也更适合家庭、情侣和想边走边拍的人。",
    duration: "0.5 - 1 天",
    highlights: ["广府古城", "永年驴肉香肠", "古城慢逛", "低体力负担"],
  },
  {
    slug: "mountain-escape",
    title: "武安山水周末线",
    summary: "想把邯郸看得更开阔一点，就把湖景、山路和武安风味放进一个周末。",
    duration: "1 - 2 天",
    highlights: ["京娘湖", "东太行", "武安锅盔", "适合自驾"],
  },
];

export const faqItems = [
  {
    q: "第一次来邯郸，先选哪条方向更稳？",
    a: "如果还没想清楚，先从成语文化或市区慢游开始，景点集中，吃饭也更顺手。",
  },
  {
    q: "带父母或孩子，会不会太赶？",
    a: "不会。把“少走路”“轻松一点”这类要求写进去，路线会明显偏保守和省体力。",
  },
  {
    q: "只有晚上有空，还值得安排吗？",
    a: "值得。邯郸道和本地小吃很适合拼成一条 4 到 6 小时的轻夜游。",
  },
  {
    q: "生成完之后还能继续改吗？",
    a: "可以。你只要补一句要求，比如“多留点吃饭时间”或“减少换乘”，就能继续细调。",
  },
];

export const quickPrompts = [
  "周末来邯郸两天，想看历史，也想吃几样本地特色。",
  "带父母玩一天，尽量少走路，路线轻松一点。",
  "只想晚上出门，想逛邯郸道再吃点地道小吃。",
  "想去山水风景，顺便安排一顿舒服的午饭。",
];

export const poiLookup = Object.fromEntries(featuredPois.map((item) => [item.id, item]));
export const foodLookup = Object.fromEntries(
  foodCatalog
    .filter((item) => typeof item.lat === "number" && typeof item.lng === "number")
    .map((item) => [item.id, item]),
);

export function getThemeBySlug(slug: string) {
  return siteThemes.find((item) => item.slug === slug);
}

export function getPoiBySlug(slug: string) {
  return featuredPois.find((item) => item.slug === slug);
}

export function getFoodBySlug(slug: string) {
  return foodCatalog.find((item) => item.slug === slug);
}

export function getRouteTemplateBySlug(slug: string) {
  return routeTemplates.find((item) => item.slug === slug);
}

export function listPoisByTheme(slug: string) {
  return featuredPois.filter((item) => item.themeSlugs.includes(slug));
}

export function listFoodsForTheme(slug: string) {
  return foodCatalog.filter((item) =>
    slug === "night-food"
      ? item.tags.includes("夜游") || item.tags.includes("小吃") || item.bestTimeToEat.includes("夜")
      : slug === "taiji-culture"
        ? item.slug.includes("yongnian")
        : slug === "mountain-leisure"
          ? item.slug.includes("wuan")
          : slug === "family-friendly"
            ? item.tags.includes("汤食") || item.tags.includes("熟食")
            : true,
  );
}
