import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { hash } from "bcryptjs";
import {
  PrismaClient,
  RiskSeverity,
  RiskType,
  Role,
  StandardSourceType,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedDocument = {
  id: string;
  code: string;
  title: string;
  publisher: string;
  sourceType: StandardSourceType;
  sourceUrl: string | null;
  version: string;
  effectiveDate: string;
  language: string;
  clauses: Array<{
    id: string;
    clauseCode: string;
    heading: string;
    text: string;
    riskTags: string[];
    buildingTypes: string[];
    isOfficialText: boolean;
  }>;
};

async function seedUsers() {
  const passwordHash = await hash("DemoPass123!", 12);
  const users = [
    ["inspector@example.com", "演示巡查员", Role.INSPECTOR],
    ["rectifier@example.com", "演示整改人", Role.RECTIFIER],
    ["reviewer@example.com", "演示复核员", Role.REVIEWER],
    ["admin@example.com", "演示管理员", Role.ADMIN],
  ] as const;

  for (const [email, name, role] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash },
      create: { email, name, role, passwordHash },
    });
  }
}

async function seedBuildings() {
  const buildings = [
    {
      code: "HB-A01",
      name: "示范木构院落 A-01",
      type: "traditional_timber_courtyard",
      era: "清代",
      addressLabel: "华北地区某历史文化街区",
      summary: "单层木构院落，含正殿、东西厢房和封闭排水沟。演示案例已脱敏。",
      riskTags: ["fire", "water", "vegetation", "visitor"],
    },
    {
      code: "HB-B02",
      name: "示范砖石会馆 B-02",
      type: "brick_stone_hall",
      era: "民国",
      addressLabel: "华北地区某历史建筑群",
      summary: "砖石承重会馆建筑，局部木屋架，当前作为公共文化空间使用。",
      riskTags: ["electrical", "water", "human_activity"],
    },
    {
      code: "HB-C03",
      name: "示范古村落 C-03",
      type: "ancient_village",
      era: "明清",
      addressLabel: "华北地区某传统村落",
      summary: "包含多处传统民居和街巷的脱敏古村落演示档案。",
      riskTags: ["fire", "electrical", "construction"],
    },
  ];

  for (const building of buildings) {
    await prisma.building.upsert({
      where: { code: building.code },
      update: building,
      create: building,
    });
  }

  const buildingA = await prisma.building.findUniqueOrThrow({
    where: { code: "HB-A01" },
  });
  const inspector = await prisma.user.findUniqueOrThrow({
    where: { email: "inspector@example.com" },
  });

  await prisma.inspection.upsert({
    where: { id: "demo_inspection_001" },
    update: {
      summary: "暴雨后巡查发现正殿东侧排水沟积水，墙脚出现新湿痕，周边有杂草根系侵入。",
      status: "PENDING_REVIEW",
    },
    create: {
      id: "demo_inspection_001",
      buildingId: buildingA.id,
      inspectorId: inspector.id,
      status: "PENDING_REVIEW",
      season: "秋季",
      weather: "暴雨后",
      summary: "暴雨后巡查发现正殿东侧排水沟积水，墙脚出现新湿痕，周边有杂草根系侵入。",
      plannedFor: new Date("2026-09-24T02:00:00.000Z"),
      submittedAt: new Date("2026-09-24T03:00:00.000Z"),
    },
  });

  await prisma.buildingRiskHistory.upsert({
    where: { id: "demo_history_001" },
    update: {},
    create: {
      id: "demo_history_001",
      buildingId: buildingA.id,
      riskType: RiskType.WATER,
      severity: RiskSeverity.MEDIUM,
      summary: "上一年度雨季曾出现东侧墙脚返潮，已完成局部排水清理。",
      happenedAt: new Date("2025-08-12T00:00:00.000Z"),
    },
  });
}

async function seedStandards() {
  const filePath = path.join(
    process.cwd(),
    "content",
    "standards",
    "seed-standards.json",
  );
  const data = JSON.parse(readFileSync(filePath, "utf8")) as {
    documents: SeedDocument[];
  };

  for (const document of data.documents) {
    await prisma.standardDocument.upsert({
      where: { code: document.code },
      update: {
        id: document.id,
        title: document.title,
        publisher: document.publisher,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl,
        version: document.version,
        effectiveDate: new Date(document.effectiveDate),
        language: document.language,
      },
      create: {
        id: document.id,
        code: document.code,
        title: document.title,
        publisher: document.publisher,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl,
        version: document.version,
        effectiveDate: new Date(document.effectiveDate),
        language: document.language,
      },
    });

    for (const clause of document.clauses) {
      await prisma.standardClause.upsert({
        where: {
          documentId_clauseCode: {
            documentId: document.id,
            clauseCode: clause.clauseCode,
          },
        },
        update: {
          id: clause.id,
          heading: clause.heading,
          text: clause.text,
          riskTags: clause.riskTags,
          buildingTypes: clause.buildingTypes,
          isOfficialText: clause.isOfficialText,
        },
        create: {
          id: clause.id,
          documentId: document.id,
          clauseCode: clause.clauseCode,
          heading: clause.heading,
          text: clause.text,
          riskTags: clause.riskTags,
          buildingTypes: clause.buildingTypes,
          isOfficialText: clause.isOfficialText,
        },
      });
    }
  }
}

async function main() {
  await seedUsers();
  await seedBuildings();
  await seedStandards();
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
