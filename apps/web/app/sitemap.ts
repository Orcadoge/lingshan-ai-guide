import type { MetadataRoute } from "next";

import {
  featuredPois,
  foodCatalog,
  routeTemplates,
  siteThemes,
} from "../lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qiuyu.online";

  const staticRoutes = ["", "/guide", "/faq", "/admin"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const poiRoutes = featuredPois.map((poi) => ({
    url: `${siteUrl}/poi/${poi.slug}`,
    lastModified: new Date(),
  }));

  const foodRoutes = foodCatalog.map((food) => ({
    url: `${siteUrl}/food/${food.slug}`,
    lastModified: new Date(),
  }));

  const themeRoutes = siteThemes.map((theme) => ({
    url: `${siteUrl}/theme/${theme.slug}`,
    lastModified: new Date(),
  }));

  const routePages = routeTemplates.map((route) => ({
    url: `${siteUrl}/routes/${route.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...poiRoutes, ...foodRoutes, ...themeRoutes, ...routePages];
}
