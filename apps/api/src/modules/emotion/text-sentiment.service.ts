// apps/api/src/modules/emotion/text-sentiment.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SentimentResult {
  emotion: 'positive' | 'neutral' | 'negative';
  confidence: number;
  details: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keywords: string[];
}

// 关键词兜底规则
const POSITIVE_WORDS = ['美','棒','好','喜欢','开心','赞','漂亮','舒服','满意','不错','值得','推荐','美','震撼','神圣','庄严','感动','祈福','灵验','平安','吉祥','智慧','慈悲'];
const NEGATIVE_WORDS = ['差','不好','失望','后悔','烂','贵','不值','无聊','累','拥挤','乱','差','遗憾','不满','抱怨','遗憾','浪费时间','被骗'];

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
    if (!this.arkApiKey) {
      this.logger.warn('ARK_API_KEY not configured, using keyword fallback');
      return this.keywordFallback(text);
    }

    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.arkApiKey}`,
        },
        body: JSON.stringify({
          model: this.arkModel,
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: `你是一个情感分析专家。分析用户输入文本的情感倾向，必须严格返回JSON格式：
{
  "emotion": "positive/neutral/negative",
  "confidence": 0-1之间的浮点数,
  "details": { "positive": 0.0, "neutral": 0.0, "negative": 0.0 },
  "keywords": ["关键词1", "关键词2"]
}
只返回JSON，不要任何其他文字。`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '';

      // 提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as SentimentResult;
        return result;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      this.logger.error(`LLM sentiment analysis failed: ${error.message}, falling back to keywords`);
      return this.keywordFallback(text);
    }
  }

  private keywordFallback(text: string): SentimentResult {
    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of POSITIVE_WORDS) {
      if (text.includes(word)) positiveScore += 1;
    }
    for (const word of NEGATIVE_WORDS) {
      if (text.includes(word)) negativeScore += 1;
    }

    const total = positiveScore + negativeScore;
    if (total === 0) {
      return {
        emotion: 'neutral',
        confidence: 0.6,
        details: { positive: 0.33, neutral: 0.34, negative: 0.33 },
        keywords: [],
      };
    }

    const posRatio = positiveScore / total;
    const negRatio = negativeScore / total;

    if (posRatio > negRatio) {
      return {
        emotion: 'positive',
        confidence: Math.min(posRatio + 0.3, 0.95),
        details: { positive: posRatio, neutral: 1 - total / (text.length + 1), negative: negRatio },
        keywords: POSITIVE_WORDS.filter(w => text.includes(w)),
      };
    } else if (negRatio > posRatio) {
      return {
        emotion: 'negative',
        confidence: Math.min(negRatio + 0.3, 0.95),
        details: { positive: posRatio, neutral: 1 - total / (text.length + 1), negative: negRatio },
        keywords: NEGATIVE_WORDS.filter(w => text.includes(w)),
      };
    }

    return {
      emotion: 'neutral',
      confidence: 0.5,
      details: { positive: 0.33, neutral: 0.34, negative: 0.33 },
      keywords: [],
    };
  }
}
