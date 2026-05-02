"use client";

import { useEffect, useRef, useState } from "react";

type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  label: string;
  kind: "poi" | "food";
};

type RouteMapProps = {
  points: MapPoint[];
  transportMode?: "self-drive" | "public" | "taxi" | "walk-first";
};

const DEFAULT_CENTER: [number, number] = [114.49, 36.61];
const DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

function buildMarkerElement(index: number, kind: MapPoint["kind"]) {
  const marker = document.createElement("button");
  const background = kind === "poi" ? "#2f5741" : "#a36b38";

  marker.type = "button";
  marker.ariaLabel = `第 ${index} 站`;
  marker.style.width = "34px";
  marker.style.height = "34px";
  marker.style.borderRadius = "999px";
  marker.style.border = "2px solid rgba(255,255,255,0.92)";
  marker.style.background = background;
  marker.style.color = "#fff";
  marker.style.display = "grid";
  marker.style.placeItems = "center";
  marker.style.fontSize = "13px";
  marker.style.fontWeight = "700";
  marker.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
  marker.style.cursor = "pointer";
  marker.style.padding = "0";
  marker.textContent = String(index);

  return marker;
}

function buildPopupContent(point: MapPoint) {
  const wrapper = document.createElement("div");
  const title = document.createElement("p");
  const meta = document.createElement("p");

  wrapper.style.minWidth = "176px";
  wrapper.style.padding = "2px 0";

  title.style.margin = "0";
  title.style.fontSize = "14px";
  title.style.fontWeight = "600";
  title.style.color = "#1d221e";
  title.textContent = point.name;

  meta.style.margin = "6px 0 0";
  meta.style.fontSize = "12px";
  meta.style.lineHeight = "1.5";
  meta.style.color = "#6f5e51";
  meta.textContent = point.label;

  wrapper.append(title, meta);

  return wrapper;
}

function buildMapHint(
  pointCount: number,
  transportMode: RouteMapProps["transportMode"],
) {
  if (pointCount < 2) {
    return "当前已显示真实点位，底图基于 MapLibre 与 OpenFreeMap。";
  }

  if (transportMode === "walk-first") {
    return "当前已显示真实点位与顺序轨迹，步行细节请出发前再看实时导航。底图基于 MapLibre 与 OpenFreeMap。";
  }

  if (transportMode === "public") {
    return "当前已显示真实点位与顺序轨迹，公交与换乘请以出发时的实时导航为准。底图基于 MapLibre 与 OpenFreeMap。";
  }

  return "当前已显示真实点位与顺序轨迹，开车或打车时可以直接结合导航继续看实时路况。底图基于 MapLibre 与 OpenFreeMap。";
}

export function RouteMap({ points, transportMode = "taxi" }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const [mapStatus, setMapStatus] = useState<
    "disabled" | "loading" | "ready" | "error"
  >("loading");
  const [mapHint, setMapHint] = useState(
    "当前为示意地图。切换到 MapLibre 后，这里会直接显示真实点位与顺序轨迹。",
  );

  const mapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "maplibre";
  const mapStyleUrl =
    process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL ?? DEFAULT_STYLE_URL;
  const preferRealMap = mapProvider !== "schematic";

  useEffect(() => {
    if (!points.length) {
      setMapStatus("disabled");
      setMapHint("暂时还没有可展示的点位，等路线生成后，这里会直接显示地图位置。");
      return;
    }

    if (!preferRealMap || !mapContainerRef.current) {
      setMapStatus("disabled");
      setMapHint("当前为示意地图。切换到 MapLibre 后，这里会直接显示真实点位与顺序轨迹。");
      return;
    }

    let cancelled = false;
    setMapStatus("loading");
    setMapHint("地图加载中...");

    (async () => {
      try {
        const maplibre = (await import("maplibre-gl")).default;
        const firstPoint = points[0];

        if (cancelled || !mapContainerRef.current || !firstPoint) {
          return;
        }

        const map = new maplibre.Map({
          container: mapContainerRef.current,
          style: mapStyleUrl,
          center: [firstPoint.lng ?? DEFAULT_CENTER[0], firstPoint.lat ?? DEFAULT_CENTER[1]],
          zoom: points.length > 1 ? 10.8 : 12.6,
        });

        map.addControl(
          new maplibre.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "top-right",
        );

        await new Promise<void>((resolve) => {
          if (map.loaded()) {
            resolve();
            return;
          }

          map.once("load", () => resolve());
        });

        if (cancelled) {
          map.remove();
          return;
        }

        points.forEach((point, index) => {
          const marker = new maplibre.Marker({
            element: buildMarkerElement(index + 1, point.kind),
            anchor: "bottom",
          })
            .setLngLat([point.lng, point.lat])
            .setPopup(
              new maplibre.Popup({
                offset: 18,
                closeButton: false,
                maxWidth: "220px",
              }).setDOMContent(buildPopupContent(point)),
            );

          marker.addTo(map);
        });

        if (points.length > 1) {
          map.addSource("route-path", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: points.map((point) => [point.lng, point.lat]),
              },
              properties: {},
            },
          });

          map.addLayer({
            id: "route-path-line",
            type: "line",
            source: "route-path",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#2f5741",
              "line-width": 5,
              "line-opacity": 0.72,
            },
          });
        }

        if (points.length === 1) {
          map.easeTo({
            center: [firstPoint.lng, firstPoint.lat],
            zoom: 12.8,
            duration: 0,
          });
        } else {
          const bounds = points.reduce(
            (currentBounds, point) =>
              currentBounds.extend([point.lng, point.lat]),
            new maplibre.LngLatBounds(
              [firstPoint.lng, firstPoint.lat],
              [firstPoint.lng, firstPoint.lat],
            ),
          );

          map.fitBounds(bounds, {
            padding: 52,
            maxZoom: 13.2,
            duration: 0,
          });
        }

        mapRef.current = map;
        setMapHint(buildMapHint(points.length, transportMode));
        setMapStatus("ready");
      } catch {
        if (!cancelled) {
          setMapStatus("error");
          setMapHint("MapLibre 地图暂时加载失败，当前已自动切回示意地图。");
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapStyleUrl, points, preferRealMap, transportMode]);

  if (points.length === 0) {
    return (
      <div className="grid min-h-80 place-items-center rounded-[24px] border border-dashed border-[#ddd4c8] bg-[#f7f4ee] px-6 text-center text-sm leading-7 text-[#6f5e51]">
        暂时还没有可展示的点位，等路线生成后，这里会直接显示地图位置。
      </div>
    );
  }

  if (preferRealMap && mapStatus !== "error") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[#ddd4c8] bg-white">
        <div className="relative">
          <div ref={mapContainerRef} className="h-[380px] w-full" />
          {mapStatus === "loading" ? (
            <div className="absolute inset-0 grid place-items-center bg-white/72 text-sm text-[#6f5e51] backdrop-blur-sm">
              地图加载中...
            </div>
          ) : null}
        </div>
        <div className="border-t border-[#e5dfd6] bg-[#fbfaf7] px-4 py-3 text-xs text-[#6f5e51]">
          {mapHint}
        </div>
      </div>
    );
  }

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const positionedPoints = points.map((point) => {
    const x = ((point.lng - minLng) / Math.max(maxLng - minLng, 0.01)) * 100;
    const y = ((maxLat - point.lat) / Math.max(maxLat - minLat, 0.01)) * 100;

    return {
      ...point,
      x,
      y,
    };
  });

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#ddd4c8] bg-[radial-gradient(circle_at_20%_20%,rgba(194,165,125,0.12),transparent_30%),linear-gradient(180deg,#fbfaf7_0%,#f2eee7_100%)]">
      <div className="relative h-[360px] w-full">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke="#8b765b"
            strokeWidth="0.8"
            strokeDasharray="2.5 2"
            points={positionedPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          />
        </svg>
        {positionedPoints.map((point, index) => (
          <div
            key={point.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-full border-2 text-xs font-semibold shadow-lg ${
                point.kind === "poi"
                  ? "border-[#2f5741] bg-[#2f5741] text-white"
                  : "border-[#a36b38] bg-[#a36b38] text-white"
              }`}
            >
              {index + 1}
            </div>
            <div className="mt-2 min-w-32 rounded-2xl border border-white/70 bg-white/92 px-3 py-2 text-xs text-[#42362f] shadow-sm">
              <p className="font-semibold">{point.name}</p>
              <p className="mt-1 text-[#7a6a5d]">{point.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#ddd4c8] bg-white/60 px-4 py-3 text-xs text-[#6f5e51]">
        {mapHint}
      </div>
    </div>
  );
}
