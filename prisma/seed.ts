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

async function seedDemoWorkflow() {
  const [buildingA, inspector, reviewer, rectifier] = await Promise.all([
    prisma.building.findUniqueOrThrow({ where: { code: "HB-A01" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "inspector@example.com" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "reviewer@example.com" } }),
    prisma.user.findUniqueOrThrow({ where: { email: "rectifier@example.com" } }),
  ]);

  await prisma.inspection.upsert({
    where: { id: "demo_inspection_001" },
    update: {
      status: "PENDING_REVIEW",
      summary: "暴雨后巡查发现正殿东侧排水沟积水，墙脚出现新湿痕，周边有杂草根系侵入。",
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

  const inspectionEvidence = [
    ["demo_inspection_evidence_001", "东侧排水沟积水现状.jpg", "排水沟积水与堵塞"],
    ["demo_inspection_evidence_002", "正殿墙脚湿痕.jpg", "墙脚新增湿痕"],
    ["demo_inspection_evidence_003", "墙脚植被根系.jpg", "排水沟周边杂草根系"],
  ] as const;

  for (const [id, originalName, altText] of inspectionEvidence) {
    await prisma.inspectionEvidence.upsert({
      where: { id },
      update: { originalName, altText },
      create: {
        id,
        inspectionId: "demo_inspection_001",
        kind: "PHOTO",
        originalName,
        mimeType: "image/png",
        sizeBytes: 0,
        altText,
        sourceType: "PROJECT_GENERATED",
        licenseNote: "界面演示素材位，不是真实病害证据",
        exifStripped: true,
      },
    });
  }

  const findings = [
    {
      id: "demo_finding_water_001",
      title: "排水与渗漏风险",
      description:
        "正殿东侧排水沟存在积水，墙脚出现新湿痕。现场照片可以证明异常现象，但尚不能确认是否形成新的结构性渗漏。",
      riskType: RiskType.WATER,
      severity: RiskSeverity.HIGH,
      confidence: 0.92,
      uncertainty: "需要专业人员复核水痕是否来自新增渗漏，并测量影响范围。",
      recommendedAction: "复核排水路径、墙脚和地下空间，清理堵塞并记录复查结果。",
    },
    {
      id: "demo_finding_structure_001",
      title: "墙体裂缝线索",
      description: "墙脚附近出现纵向裂缝线索，当前证据不足以判断是否属于新增结构异常。",
      riskType: RiskType.STRUCTURE,
      severity: RiskSeverity.MEDIUM,
      confidence: 0.78,
      uncertainty: "缺少裂缝宽度、深度和发展趋势的对比测量。",
      recommendedAction: "补充裂缝宽度测量，拍摄同角度对比照片并提交专业复核。",
    },
  ] as const;

  for (const finding of findings) {
    await prisma.finding.upsert({
      where: { id: finding.id },
      update: {
        ...finding,
        status: "PROPOSED",
        confirmedById: null,
        confirmedAt: null,
      },
      create: {
        ...finding,
        inspectionId: "demo_inspection_001",
        status: "PROPOSED",
      },
    });
  }

  const citations = [
    [
      "demo_citation_water_001",
      "demo_finding_water_001",
      "rule_water_01",
      "现场观察对应排水与渗漏巡查要求。",
    ],
    [
      "demo_citation_structure_001",
      "demo_finding_structure_001",
      "rule_structure_01",
      "裂缝线索需要人工复核，不直接形成结构结论。",
    ],
  ] as const;

  for (const [id, findingId, clauseId, relevance] of citations) {
    await prisma.findingCitation.upsert({
      where: { findingId_clauseId: { findingId, clauseId } },
      update: { id, relevance },
      create: { id, findingId, clauseId, relevance },
    });
  }

  await prisma.agentRun.upsert({
    where: { id: "demo_agent_run_001" },
    update: {
      status: "COMPLETED",
      completedAt: new Date("2026-09-25T03:10:12.400Z"),
    },
    create: {
      id: "demo_agent_run_001",
      inspectionId: "demo_inspection_001",
      status: "COMPLETED",
      provider: "deepseek",
      model: "deepseek-v4-flash",
      promptVersion: "inspection-v1",
      toolSchemaVersion: "tools-v1",
      inputJson: {
        buildingCode: buildingA.code,
        season: "秋季",
        weather: "暴雨后",
      },
      outputJson: {
        plan: [
          {
            id: "plan-water",
            title: "检查排水路径与墙脚渗漏",
            rationale: "暴雨后积水可能沿墙脚形成持续潮湿。",
            requiredEvidence: ["排水沟全景", "墙脚近景", "同角度复查照片"],
          },
          {
            id: "plan-structure",
            title: "复核新增裂缝线索",
            rationale: "需要宽度和方向测量后才能判断变化。",
            requiredEvidence: ["裂缝近景", "测量记录", "历史对比照片"],
          },
        ],
        findings: [],
        uncertainties: [
          "智能初判不能替代专业人员对渗漏和结构异常的判断。",
          "裂缝宽度和历史对比数据尚未补齐。",
        ],
        suggestedTasks: [],
      },
      startedAt: new Date("2026-09-25T03:10:00.000Z"),
      completedAt: new Date("2026-09-25T03:10:12.400Z"),
    },
  });

  await prisma.inspection.upsert({
    where: { id: "demo_inspection_workflow_001" },
    update: { status: "RECTIFYING" },
    create: {
      id: "demo_inspection_workflow_001",
      buildingId: buildingA.id,
      inspectorId: inspector.id,
      status: "RECTIFYING",
      season: "秋季",
      weather: "小雨后转阴",
      summary: "正殿东侧墙脚出现新增湿痕和裂缝线索，现场已完成工具测量并采集对比照片。",
      plannedFor: new Date("2026-09-25T01:30:00.000Z"),
      submittedAt: new Date("2026-09-25T02:30:00.000Z"),
    },
  });

  await prisma.finding.upsert({
    where: { id: "demo_finding_workflow_water_001" },
    update: {
      status: "CONFIRMED",
      confirmedById: reviewer.id,
      confirmedAt: new Date("2026-09-25T03:40:00.000Z"),
    },
    create: {
      id: "demo_finding_workflow_water_001",
      inspectionId: "demo_inspection_workflow_001",
      title: "排水与墙脚渗漏风险",
      description:
        "新增湿痕与排水沟积水同时出现，需要先完成临时排水和裂缝测量，再提交人工复核。",
      riskType: RiskType.WATER,
      severity: RiskSeverity.HIGH,
      status: "CONFIRMED",
      confidence: 0.9,
      uncertainty: "尚未判断水痕是否来自新增地下渗漏。",
      recommendedAction: "补测裂缝宽度，清理墙脚积水并设置临时防雨措施。",
      confirmedById: reviewer.id,
      confirmedAt: new Date("2026-09-25T03:40:00.000Z"),
    },
  });

  await prisma.findingCitation.upsert({
    where: {
      findingId_clauseId: {
        findingId: "demo_finding_workflow_water_001",
        clauseId: "rule_water_01",
      },
    },
    update: {},
    create: {
      id: "demo_citation_workflow_water_001",
      findingId: "demo_finding_workflow_water_001",
      clauseId: "rule_water_01",
      relevance: "现场积水与湿痕符合演示规则中的排水与渗漏巡查要求。",
    },
  });

  await prisma.rectificationTask.upsert({
    where: { id: "demo_task_001" },
    update: { status: "PENDING_REVIEW" },
    create: {
      id: "demo_task_001",
      findingId: "demo_finding_workflow_water_001",
      assigneeId: rectifier.id,
      createdById: reviewer.id,
      title: "处理东侧排水与墙脚渗漏",
      description: "完成排水清理、裂缝宽度测量和临时防雨处置。",
      acceptanceCriteria:
        "提交处理说明、裂缝测量记录、风险位置照片和整改后同角度对比证据。",
      priority: RiskSeverity.HIGH,
      status: "PENDING_REVIEW",
      dueAt: new Date("2026-09-28T10:00:00.000Z"),
      completedAt: null,
    },
  });

  const taskEvidence = [
    [
      "demo_task_evidence_001",
      "排水沟清理与临时防雨处理说明",
      "已完成积水清理和临时防雨遮挡，未实施结构修复。",
      "NOTE",
    ],
    [
      "demo_task_evidence_002",
      "裂缝宽度测量记录",
      "裂缝宽度约 2.6 mm，已完成同角度复拍。",
      "DOCUMENT",
    ],
  ] as const;

  for (const [id, originalName, description, kind] of taskEvidence) {
    await prisma.taskEvidence.upsert({
      where: { id },
      update: { originalName, description, kind },
      create: {
        id,
        taskId: "demo_task_001",
        submittedById: rectifier.id,
        kind,
        description,
        originalName,
        mimeType: kind === "NOTE" ? "text/plain" : "application/pdf",
        sizeBytes: 0,
        sourceType: "SELF_CAPTURED",
        exifStripped: true,
      },
    });
  }

  const reviews = [
    {
      id: "demo_review_workflow_confirm_001",
      inspectionId: "demo_inspection_workflow_001",
      findingId: "demo_finding_workflow_water_001",
      taskId: null,
      action: "CONFIRM_FINDING" as const,
      comment: "现场证据与巡查记录一致，确认进入整改。",
      createdAt: new Date("2026-09-25T03:40:00.000Z"),
    },
    {
      id: "demo_review_workflow_task_001",
      inspectionId: "demo_inspection_workflow_001",
      findingId: "demo_finding_workflow_water_001",
      taskId: "demo_task_001",
      action: "CREATE_TASK" as const,
      comment: "创建整改任务并要求补充测量和对比照片。",
      createdAt: new Date("2026-09-25T03:42:00.000Z"),
    },
  ];

  for (const review of reviews) {
    await prisma.reviewRecord.upsert({
      where: { id: review.id },
      update: {},
      create: { ...review, actorId: reviewer.id },
    });
  }
}

async function main() {
  await seedUsers();
  await seedBuildings();
  await seedStandards();
  await seedDemoWorkflow();
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
