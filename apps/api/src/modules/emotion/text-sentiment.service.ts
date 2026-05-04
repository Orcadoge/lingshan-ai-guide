// apps/api/src/modules/emotion/text-sentiment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** 五维情感标签（与数据大屏情感分布对应） */
type EmotionLabel = 'positive' | 'neutral' | 'negative';
type EmotionFineLabel = 'happy' | 'calm' | 'confused' | 'tired' | 'dissatisfied';

interface SentimentResult {
  emotion: EmotionLabel;
  fineEmotion: EmotionFineLabel;
  confidence: number;
  details: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keywords: string[];
}

/** 旅游场景关键词兜底规则 — 中文+英文 */
const POSITIVE_WORDS = [
  '美','棒','好','喜欢','开心','赞','漂亮','舒服','满意','不错','值得','推荐',
  '震撼','神圣','庄严','感动','祈福','灵验','平安','吉祥','智慧','慈悲',
  '惊艳','壮观','舒适','愉悦','幸福','快乐','惊喜','回味无穷','不虚此行',
  'good','great','nice','love','happy','amazing','wonderful','excellent'
];

const NEGATIVE_WORDS = [
  '差','不好','失望','后悔','烂','贵','不值','无聊','累','拥挤','乱',
  '遗憾','不满','抱怨','浪费时间','被骗','糟糕','气愤','愤怒','恶心',
  'bad','hate','terrible','awful','disappointed','boring','expensive'
];

/** 细粒度情感映射规则（关键词 → 五维标签） */
const FINE_EMOTION_MAP: Record<string, EmotionFineLabel> = {
  '开心': 'happy', '喜欢': 'happy', '赞': 'happy', '愉悦': 'happy', '惊喜': 'happy',
  '好': 'calm', '不错': 'calm', '舒服': 'calm', '平静': 'calm', '满意': 'calm',
  '累': 'tired', '疲惫': 'tired', '困': 'tired', '走不动': 'tired',
  '不知道': 'confused', '不懂': 'confused', '疑惑': 'confused', '迷路': 'confused',
  '差': 'dissatisfied', '失望': 'dissatisfied', '后悔': 'dissatisfied', '贵': 'dissatisfied',
};

/** 旅游场景专用情感分析 Prompt */
const SENTIMENT_SYSTEM_PROMPT = `你是一个专业的旅游场景情感分析助手。请分析游客对话内容的情感倾向，必须严格返回JSON格式，不要包含任何其他文字。

分析维度：
1. 粗粒度（emotion）：positive / neutral / negative
2. 细粒度（fineEmotion）：happy（开心）/ calm（平静）/ confused（困惑）/ tired（疲惫）/ dissatisfied（不满）
3. 置信度（confidence）：0~1之间
4. 三态分布（details）：positive + neutral + negative = 1.0
5. 关键词（keywords）：提取最能反映情感的词汇，最多5个

返回格式：
{
  "emotion": "positive",
  "fineEmotion": "happy",
  "confidence": 0.92,
  "details": { "positive": 0.85, "neutral": 0.10, "negative": 0.05 },
  "keywords": ["震撼", "值得", "推荐"]
}

注意事项：
- details中三个值之和必须严格等于1.0（允许±0.01误差）
- 旅游场景常见表达：
  * 景点震撼、不虚此行 → positive + happy
  * 走走看看、一般般 → neutral + calm
  * 太累、走不动 → neutral/negative + tired
  * 迷路、不知道去哪儿 → neutral/negative + confused
  * 票价贵、后悔来 → negative + dissatisfied`;

@Injectable()
export class TextSentimentService {
  private readonly logger = new Logger(TextSentimentService.name);
  private readonly arkApiKey: string;
  private readonly arkModel: string;

  constructor(private readonly configService: ConfigService) {
    this.arkApiKey = this.configService.get<string>('ARK_API_KEY') || '';
    this.arkModel = this.configService.get<string>('ARK_MODEL') || 'doubao-seed-2-0-mini';
  }

  async analyze(text: string): Promise<SentimentResult> {
    if (!text || text.trim().length === 0) {
      return this.buildNeutralResult([]);
    }

    if (!this.arkApiKey) {
      this.logger.warn('ARK_API_KEY not configured, using keyword fallback');
      return this.keywordFallback(text);
    }

    try {
      const result = await this.callLLM(text);
      // 校验并修正 details 之和
      return this.normalizeDetails(result);
    } catch (error: any) {
      this.logger.error(`LLM sentiment analysis failed: ${error.message}, falling back to keywords`);
      return this.keywordFallback(text);
    }
  }

  private async callLLM(text: string): Promise<SentimentResult> {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.arkApiKey}`,
      },
      body: JSON.stringify({
        model: this.arkModel,
        temperature: 0.2,
        max_tokens: 256,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
          { role: 'user', content: `请分析以下游客文本的情感倾向：\n\n${text}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';

    const parsed = JSON.parse(content) as Partial<SentimentResult>;

    // 字段校验与默认值填充
    const emotion = (parsed.emotion as EmotionLabel) ?? 'neutral';
    const fineEmotion = (parsed.fineEmotion as EmotionFineLabel)
      ?? this.inferFineEmotion(emotion, parsed.keywords ?? []);

    return {
      emotion,
      fineEmotion,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      details: {
        positive: parsed.details?.positive ?? 0.33,
        neutral: parsed.details?.neutral ?? 0.34,
        negative: parsed.details?.negative ?? 0.33,
      },
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    };
  }

  /** 根据粗粒度情感+关键词推断细粒度标签 */
  private inferFineEmotion(emotion: EmotionLabel, keywords: string[]): EmotionFineLabel {
    for (const kw of keywords) {
      if (FINE_EMOTION_MAP[kw]) return FINE_EMOTION_MAP[kw];
    }
    // 默认映射
    if (emotion === 'positive') return 'happy';
    if (emotion === 'negative') return 'dissatisfied';
    return 'calm';
  }

  /** 归一化 details，确保 positive + neutral + negative = 1.0 */
  private normalizeDetails(result: SentimentResult): SentimentResult {
    const { positive, neutral, negative } = result.details;
    const sum = positive + neutral + negative;

    if (sum === 0 || Math.abs(sum - 1.0) < 0.01) {
      return result;
    }

    return {
      ...result,
      details: {
        positive: parseFloat((positive / sum).toFixed(3)),
        neutral: parseFloat((neutral / sum).toFixed(3)),
        negative: parseFloat((1 - (positive / sum) - (neutral / sum)).toFixed(3)),
      },
    };
  }

  private keywordFallback(text: string): SentimentResult {
    let positiveScore = 0;
    let negativeScore = 0;
    const matchedKeywords: string[] = [];

    for (const word of POSITIVE_WORDS) {
      if (text.includes(word)) {
        positiveScore += 1;
        if (!matchedKeywords.includes(word)) matchedKeywords.push(word);
      }
    }
    for (const word of NEGATIVE_WORDS) {
      if (text.includes(word)) {
        negativeScore += 1;
        if (!matchedKeywords.includes(word)) matchedKeywords.push(word);
      }
    }

    const total = positiveScore + negativeScore;
    if (total === 0) {
      return this.buildNeutralResult([]);
    }

    const posRatio = positiveScore / total;
    const negRatio = negativeScore / total;
    const neuRatio = 0; // 关键词匹配场景下，neutral=0（有明确匹配）

    let emotion: EmotionLabel;
    let fineEmotion: EmotionFineLabel;

    if (posRatio > negRatio) {
      emotion = 'positive';
      fineEmotion = this.inferFineEmotionFromKeywords(matchedKeywords, 'positive');
    } else if (negRatio > posRatio) {
      emotion = 'negative';
      fineEmotion = this.inferFineEmotionFromKeywords(matchedKeywords, 'negative');
    } else {
      emotion = 'neutral';
      fineEmotion = 'calm';
    }

    // 构建归一化的 details
    const details = this.buildNormalizedDetails(posRatio, negRatio);

    return {
      emotion,
      fineEmotion,
      confidence: Math.min(Math.max(posRatio, negRatio) + 0.2, 0.95),
      details,
      keywords: matchedKeywords.slice(0, 5),
    };
  }

  /** 从关键词推断细粒度标签 */
  private inferFineEmotionFromKeywords(keywords: string[], emotion: EmotionLabel): EmotionFineLabel {
    for (const kw of keywords) {
      if (FINE_EMOTION_MAP[kw]) return FINE_EMOTION_MAP[kw];
    }
    return emotion === 'positive' ? 'happy' : 'dissatisfied';
  }

  /** 构建归一化的三态分布 */
  private buildNormalizedDetails(posRatio: number, negRatio: number) {
    const neutralRatio = 1 - posRatio - negRatio;
    return {
      positive: parseFloat(posRatio.toFixed(3)),
      neutral: parseFloat(Math.max(0, neutralRatio).toFixed(3)),
      negative: parseFloat(negRatio.toFixed(3)),
    };
  }

  private buildNeutralResult(keywords: string[]): SentimentResult {
    return {
      emotion: 'neutral',
      fineEmotion: 'calm',
      confidence: 1,
      details: { positive: 0.33, neutral: 0.34, negative: 0.33 },
      keywords,
    };
  }
}
