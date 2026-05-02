import type { PlanResult } from "@handan/shared";

export type VoiceGuideMessage = {
  role: "user" | "assistant";
  content: string;
};

export type VoiceGuideResponse = {
  reply: string;
  provider: string;
  model?: string;
  generatedAt: string;
  fallbackReason?: string;
  voice: {
    mode: string;
    realtimeModel: string;
    realtimeGatewayReady: boolean;
  };
};

export type VoiceTtsResponse = {
  audioBase64: string | null;
  contentType: string | null;
  provider: string;
  model: string;
  voiceType: string;
  fallbackReason?: string;
};

export type PlanStreamProgress = {
  stage: "loading-data" | "rule-draft" | "ai-polish" | "saving";
  message: string;
  preview?: {
    tripTitle: string;
    summary: string;
    days: Array<{
      dayIndex: number;
      theme: string;
      stops: string[];
    }>;
  };
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "请求失败");
  }

  return response.json() as Promise<T>;
}

export async function generatePlan(input: unknown) {
  const response = await fetch("/api/proxy/plans/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<PlanResult>(response);
}

function parseSseEvent(rawEvent: string) {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
}

export async function generatePlanStream(
  input: unknown,
  onProgress: (event: PlanStreamProgress) => void,
) {
  const response = await fetch("/api/proxy/plans/generate-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "请求失败");
  }

  if (!response.body) {
    return parseResponse<PlanResult>(response);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const parsed = parseSseEvent(rawEvent.trim());

      if (!parsed.data) {
        continue;
      }

      const payload = JSON.parse(parsed.data) as unknown;

      if (parsed.event === "progress") {
        onProgress(payload as PlanStreamProgress);
      }

      if (parsed.event === "done") {
        return payload as PlanResult;
      }

      if (parsed.event === "error") {
        const errorPayload = payload as { message?: string };
        throw new Error(errorPayload.message ?? "生成路线失败，请稍后再试。");
      }
    }

    if (done) {
      break;
    }
  }

  throw new Error("生成路线失败，请稍后再试。");
}

export async function refinePlan(input: { sessionId: string; instruction: string }) {
  const response = await fetch("/api/proxy/plans/refine", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<PlanResult>(response);
}

export async function fetchSharedPlan(shareId: string) {
  const response = await fetch(`/api/proxy/plans/share/${shareId}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<PlanResult>(response);
}

export async function askVoiceGuide(input: {
  message: string;
  history: VoiceGuideMessage[];
}) {
  const response = await fetch("/api/proxy/voice/guide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse<VoiceGuideResponse>(response);
}

export async function synthesizeVoice(text: string) {
  const response = await fetch("/api/proxy/voice/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  return parseResponse<VoiceTtsResponse>(response);
}

export function getRealtimeVoiceWsUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const configuredUrl = process.env.NEXT_PUBLIC_REALTIME_VOICE_WS_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `${protocol}//${window.location.hostname}:3001/api/v1/voice/realtime`;
  }

  return `${protocol}//${window.location.host}/api/v1/voice/realtime`;
}

export function buildAdminAuth(username: string, password: string) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}
