import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { z } from 'zod';

import {
  callArkChatCompletion,
  getArkChatConfig,
} from '../../common/ark-client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  getRealtimeVoiceConfig,
  synthesizeWithRealtimeVoice,
} from './realtime-tts';

const voiceGuideMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(900),
});

const voiceGuideRequestSchema = z.object({
  message: z.string().min(1).max(900),
  history: z.array(voiceGuideMessageSchema).max(10).default([]),
});

const voiceTtsRequestSchema = z.object({
  text: z.string().min(1).max(360),
});

type VoiceGuideRequest = z.infer<typeof voiceGuideRequestSchema>;
type VoiceTtsRequest = z.infer<typeof voiceTtsRequestSchema>;

function buildLocalGuideFallback(message: string) {
  if (/吃|美食|小吃|晚饭|午饭/.test(message)) {
    return '可以先把丛台、赵苑这一带排在前面，午晚餐安排邯郸本地菜或驴肉火烧一类特色小吃，路线会更顺，也不会为了吃饭来回折返。';
  }

  if (/父母|老人|少走|不累|轻松/.test(message)) {
    return '这趟建议按慢节奏来，景点之间尽量选择打车或短距离步行，把停留时间留足，优先选丛台公园、赵苑这类动线清楚、休息点多的地方。';
  }

  if (/拍照|出片|照片|摄影/.test(message)) {
    return '如果想拍照，可以把古建、城墙感和水面景观放在光线更好的上午或傍晚，路线不要排太满，给每个点留一点等待好光线的时间。';
  }

  return '我建议先确定游玩时长、同行人和最想看的主题，再把景点和餐饮串成一条少折返的路线。你可以继续告诉我：半天、一天还是两天？';
}

@Controller('voice')
export class VoiceController {
  @Post('guide')
  @UsePipes(new ZodValidationPipe(voiceGuideRequestSchema))
  async guide(@Body() body: VoiceGuideRequest): Promise<unknown> {
    const arkConfig = getArkChatConfig();
    const generatedAt = new Date().toISOString();
    const realtimeConfig = getRealtimeVoiceConfig();
    const hasRealtimeGateway = Boolean(
      realtimeConfig.apiKey && realtimeConfig.appId,
    );

    try {
      const reply = await callArkChatCompletion({
        config: arkConfig,
        temperature: 0.62,
        maxTokens: 260,
        messages: [
          {
            role: 'system',
            content:
              '你是“赵都云旅·云端图鉴智行指南”的邯郸语音导游。回复要像真人导游说话，亲切、简短、具体，避免开发者术语。每次回答控制在 80 到 140 个中文字符，必要时用一个问题继续追问用户偏好。',
          },
          ...body.history.slice(-8),
          {
            role: 'user',
            content: body.message,
          },
        ],
      });

      return {
        reply,
        provider: 'volcengine-ark',
        model: arkConfig.model,
        generatedAt,
        voice: {
          mode: 'browser-speech-with-server-ai',
          realtimeModel: realtimeConfig.model,
          realtimeGatewayReady: hasRealtimeGateway,
        },
      };
    } catch (error) {
      return {
        reply: buildLocalGuideFallback(body.message),
        provider: 'rules-fallback',
        model: arkConfig.model,
        generatedAt,
        fallbackReason:
          error instanceof Error ? error.message : 'unknown_voice_error',
        voice: {
          mode: 'browser-speech-with-server-ai',
          realtimeModel: realtimeConfig.model,
          realtimeGatewayReady: hasRealtimeGateway,
        },
      };
    }
  }

  @Post('tts')
  @UsePipes(new ZodValidationPipe(voiceTtsRequestSchema))
  async tts(@Body() body: VoiceTtsRequest): Promise<unknown> {
    const realtimeConfig = getRealtimeVoiceConfig();

    try {
      const result = await synthesizeWithRealtimeVoice({
        text: body.text,
        ...realtimeConfig,
      });

      return {
        audioBase64: result.audio.toString('base64'),
        contentType: result.contentType,
        provider: 'volcengine-realtime-voice',
        model: result.model,
        voiceType: result.voiceType,
      };
    } catch (error) {
      return {
        audioBase64: null,
        contentType: null,
        provider: 'browser-speech-fallback',
        model: realtimeConfig.model,
        voiceType: realtimeConfig.voiceType,
        fallbackReason:
          error instanceof Error ? error.message : 'unknown_tts_error',
      };
    }
  }
}
