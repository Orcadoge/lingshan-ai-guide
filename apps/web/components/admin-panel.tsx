"use client";

import { Surface } from "@handan/ui";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { buildAdminAuth } from "../lib/api";

type OverviewResponse = {
  counts: {
    pois: number;
    foodVenues: number;
    promptConfigs: number;
  };
  prompts: Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    isPublished: boolean;
  }>;
};

async function fetchWithAuth<T>(url: string, auth: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "后台请求失败");
  }

  return response.json() as Promise<T>;
}

export function AdminPanel() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("change_me");
  const [auth, setAuth] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poiName, setPoiName] = useState("");
  const [foodName, setFoodName] = useState("");

  async function login() {
    const nextAuth = buildAdminAuth(username, password);
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth<OverviewResponse>("/api/proxy/admin/overview", nextAuth);
      setAuth(nextAuth);
      setOverview(data);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "后台登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function createPoi() {
    if (!auth) {
      return;
    }

    await fetchWithAuth("/api/proxy/admin/pois", auth, {
      method: "POST",
      body: JSON.stringify({
        name: poiName,
        slug: poiName.toLowerCase().replace(/\s+/g, "-"),
        district: "丛台区",
        level: null,
        lat: 36.61,
        lng: 114.49,
        tags: ["后台创建"],
        intro: "后台创建的景点记录。",
        culturalStory: null,
        recommendStayMinutes: 90,
        openingHours: null,
        ticketPriceRange: null,
        suitableCrowd: ["friends"],
        transportTips: null,
        sourceId: "src-handandao",
        freshnessDate: "2026-04-01",
        reviewStatus: "PENDING",
      }),
    });

    setPoiName("");
    await login();
  }

  async function createFoodVenue() {
    if (!auth) {
      return;
    }

    await fetchWithAuth("/api/proxy/admin/foods", auth, {
      method: "POST",
      body: JSON.stringify({
        name: foodName,
        slug: foodName.toLowerCase().replace(/\s+/g, "-"),
        district: "丛台区",
        lat: 36.61,
        lng: 114.49,
        avgPrice: 48,
        spicyLevel: "mild",
        tags: ["后台创建"],
        intro: "后台创建的餐饮门店记录。",
        openingHours: null,
        signatureDishes: ["待补充"],
        suitableCrowd: ["friends"],
        cultureStory: null,
        bestTimeToEat: "午餐 / 晚餐",
        sourceId: "src-handandao",
        freshnessDate: "2026-04-01",
        reviewStatus: "PENDING",
      }),
    });

    setFoodName("");
    await login();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Surface className="p-6">
        <div className="flex items-center gap-3 text-[#6f5238]">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-xs uppercase tracking-[0.28em]">后台鉴权</p>
        </div>
        <div className="mt-5 space-y-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="planner-input"
            placeholder="管理员账号"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="planner-input"
            placeholder="管理员密码"
            type="password"
          />
          <button
            type="button"
            onClick={login}
            className="inline-flex items-center gap-2 rounded-full bg-[#21170f] px-5 py-3 text-sm font-medium text-[#f8efe2]"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            进入后台
          </button>
          {error ? <p className="text-sm text-[#a43f35]">{error}</p> : null}
        </div>
      </Surface>

      <div className="space-y-6">
        <Surface className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[#876446]">数据概览</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
              <p className="text-sm text-[#5f5045]">景点数量</p>
              <p className="mt-2 text-2xl font-semibold text-[#21170f]">
                {overview?.counts.pois ?? "--"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
              <p className="text-sm text-[#5f5045]">餐饮门店</p>
              <p className="mt-2 text-2xl font-semibold text-[#21170f]">
                {overview?.counts.foodVenues ?? "--"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
              <p className="text-sm text-[#5f5045]">导游提示</p>
              <p className="mt-2 text-2xl font-semibold text-[#21170f]">
                {overview?.counts.promptConfigs ?? "--"}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#21170f]">新增景点</p>
            <input
              value={poiName}
              onChange={(event) => setPoiName(event.target.value)}
              className="planner-input"
              placeholder="输入新景点名称"
            />
            <button
              type="button"
              onClick={createPoi}
              disabled={!auth || !poiName}
              className="rounded-full border border-[#d8c2a1] px-4 py-2 text-sm text-[#5f5045]"
            >
              保存景点草稿
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#21170f]">新增餐饮门店</p>
            <input
              value={foodName}
              onChange={(event) => setFoodName(event.target.value)}
              className="planner-input"
              placeholder="输入新门店名称"
            />
            <button
              type="button"
              onClick={createFoodVenue}
              disabled={!auth || !foodName}
              className="rounded-full border border-[#d8c2a1] px-4 py-2 text-sm text-[#5f5045]"
            >
              提交餐饮草稿
            </button>
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-medium text-[#21170f]">导游提示</p>
          <div className="mt-4 space-y-3">
            {overview?.prompts.map((prompt) => (
              <div key={prompt.id} className="rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-[#21170f]">{prompt.name}</p>
                    <p className="mt-1 text-sm text-[#5f5045]">{prompt.description}</p>
                  </div>
                  <span className="rounded-full border border-[#d8c2a1] px-3 py-1 text-xs text-[#6f5238]">
                    {prompt.isPublished ? "已发布" : "未发布"}
                  </span>
                </div>
              </div>
            )) ?? <p className="text-sm text-[#5f5045]">登录后显示配置列表。</p>}
          </div>
        </Surface>
      </div>
    </div>
  );
}
