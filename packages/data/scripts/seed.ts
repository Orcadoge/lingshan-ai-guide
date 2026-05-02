import { prisma } from "../src/client";
import {
  dishes,
  foodVenues,
  pois,
  promptConfigs,
  sourceRecords,
  themes,
} from "../src/seed-data";

async function main() {
  for (const source of sourceRecords) {
    await prisma.sourceRecord.upsert({
      where: { id: source.id },
      update: {
        ...source,
        fetchedAt: new Date("2026-04-01T00:00:00+08:00"),
      },
      create: {
        ...source,
        fetchedAt: new Date("2026-04-01T00:00:00+08:00"),
      },
    });
  }

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { id: theme.id },
      update: theme,
      create: theme,
    });
  }

  for (const prompt of promptConfigs) {
    await prisma.promptConfig.upsert({
      where: { id: prompt.id },
      update: prompt,
      create: prompt,
    });
  }

  for (const poi of pois) {
    await prisma.poi.upsert({
      where: { id: poi.id },
      update: {
        ...poi,
        freshnessDate: new Date("2026-04-01T00:00:00+08:00"),
        reviewStatus: "APPROVED",
      },
      create: {
        ...poi,
        freshnessDate: new Date("2026-04-01T00:00:00+08:00"),
        reviewStatus: "APPROVED",
      },
    });
  }

  for (const venue of foodVenues) {
    await prisma.foodVenue.upsert({
      where: { id: venue.id },
      update: {
        ...venue,
        freshnessDate: new Date("2026-04-01T00:00:00+08:00"),
        reviewStatus: "APPROVED",
      },
      create: {
        ...venue,
        freshnessDate: new Date("2026-04-01T00:00:00+08:00"),
        reviewStatus: "APPROVED",
      },
    });
  }

  for (const dish of dishes) {
    await prisma.dish.upsert({
      where: { id: dish.id },
      update: {
        ...dish,
        freshnessDate: new Date("2026-04-01T00:00:00+08:00"),
        reviewStatus: "APPROVED",
      },
      create: {
        ...dish,
        freshnessDate: new Date("2026-04-01T00:00:00+08:00"),
        reviewStatus: "APPROVED",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
