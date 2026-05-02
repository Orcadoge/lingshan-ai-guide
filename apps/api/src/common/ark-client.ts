export type ArkChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ArkChatConfig = {
  apiKey?: string;
  baseUrl: string;
  model?: string;
};

export type ArkChatOptions = {
  messages: ArkChatMessage[];
  config?: ArkChatConfig;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
  timeoutMs?: number;
};

const DEFAULT_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_ARK_MODEL = 'doubao-seed-2-0-mini-260215';

export function normalizeArkBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

export function getArkChatConfig(): ArkChatConfig {
  return {
    apiKey:
      process.env.ARK_API_KEY ??
      process.env.VOLCENGINE_ARK_API_KEY ??
      process.env.OPENAI_API_KEY,
    baseUrl: normalizeArkBaseUrl(
      process.env.ARK_BASE_URL ??
        process.env.VOLCENGINE_ARK_BASE_URL ??
        process.env.OPENAI_BASE_URL ??
        DEFAULT_ARK_BASE_URL,
    ),
    model:
      process.env.ARK_MODEL ??
      process.env.VOLCENGINE_ARK_MODEL ??
      process.env.OPENAI_MODEL ??
      DEFAULT_ARK_MODEL,
  };
}

export function readArkMessageContent(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'choices' in payload &&
    Array.isArray((payload as { choices?: unknown[] }).choices)
  ) {
    const content = (
      payload as {
        choices: Array<{
          message?: { content?: string | Array<{ text?: string }> };
        }>;
      }
    ).choices[0]?.message?.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((item) =>
          item && typeof item === 'object' ? (item.text ?? '') : '',
        )
        .join('');
    }
  }

  throw new Error('AI 返回结构无法解析');
}

function sanitizeProviderError(raw: string) {
  return raw
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .slice(0, 700);
}

export async function callArkChatCompletion({
  messages,
  config = getArkChatConfig(),
  temperature = 0.55,
  maxTokens,
  responseFormat,
  timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 30000),
}: ArkChatOptions) {
  if (!config.apiKey || !config.model) {
    throw new Error('missing_ark_api_key_or_model');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
      messages,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => '');
    throw new Error(
      `Ark 服务调用失败：${response.status} ${sanitizeProviderError(payload)}`,
    );
  }

  return readArkMessageContent((await response.json()) as unknown);
}

export const ARK_DEFAULTS = {
  baseUrl: DEFAULT_ARK_BASE_URL,
  model: DEFAULT_ARK_MODEL,
};
