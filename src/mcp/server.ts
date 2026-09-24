import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";
import { CHARACTER_LIMIT, MCP_SERVER_NAME, MCP_SERVER_VERSION } from "./constants";
import {
  analyzeInspectionPreview,
  getBuildingOverview,
  getInspectionReport,
  listBuildings,
  listRectificationTasks,
  searchStandardClauses,
} from "./services";

function jsonText(value: unknown) {
  const text = JSON.stringify(value, null, 2);
  if (text.length <= CHARACTER_LIMIT) return text;
  return `${text.slice(0, CHARACTER_LIMIT)}\n\n[结果已截断。请通过过滤条件或分页继续查询。]`;
}

function toolResult<T extends Record<string, unknown>>(value: T) {
  return {
    content: [{ type: "text" as const, text: jsonText(value) }],
    structuredContent: value,
  };
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: `错误：${message}` }],
    isError: true,
  };
}

const paginationSchema = {
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
};

export function createWenxunMcpServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  server.registerTool(
    "wenxun_list_buildings",
    {
      title: "列出文物建筑",
      description:
        "分页列出文巡智护系统中的脱敏文物建筑档案。只读操作，返回建筑编号、名称、类型、历史风险和巡查数量。",
      inputSchema: z
        .object({
          ...paginationSchema,
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => toolResult(await listBuildings(input)),
  );

  server.registerTool(
    "wenxun_get_building",
    {
      title: "获取文物建筑档案",
      description:
        "通过建筑 ID 或建筑编号获取一个脱敏建筑档案，包括历史风险和最近巡查。buildingId 与 code 至少提供一个。",
      inputSchema: z
        .object({
          buildingId: z.string().min(1).optional(),
          code: z.string().min(1).optional(),
        })
        .strict()
        .refine((value) => Boolean(value.buildingId || value.code), {
          message: "buildingId 和 code 至少提供一个",
        }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => {
      const result = await getBuildingOverview(input);
      return result ? toolResult(result) : toolError("未找到对应的文物建筑档案");
    },
  );

  server.registerTool(
    "wenxun_search_standards",
    {
      title: "检索规范和项目规则",
      description:
        "按巡查描述、风险标签和建筑类型检索公开标准条款及项目演示规则。结果是候选依据，调用方仍需核对 sourceUrl 和 isOfficialText。",
      inputSchema: z
        .object({
          query: z.string().trim().min(2).max(3000),
          riskTags: z.array(z.string().min(1)).max(20).default([]),
          buildingType: z.string().trim().min(1).default("heritage_building"),
          limit: z.number().int().min(1).max(20).default(8),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) =>
      toolResult({
        clauses: await searchStandardClauses(input),
      }),
  );

  server.registerTool(
    "wenxun_analyze_inspection_text",
    {
      title: "预览巡查智能分析",
      description:
        "对尚未写入数据库的巡查文本运行智能体预览。工具只返回计划、风险草案、规范引用和整改任务草案，不修改数据库，也不代表人工确认。",
      inputSchema: z
        .object({
          buildingId: z.string().min(1),
          season: z.string().trim().min(1).max(20),
          weather: z.string().trim().min(1).max(50),
          summary: z.string().trim().min(5).max(4000),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (input) => {
      const result = await analyzeInspectionPreview(input);
      return result ? toolResult(result) : toolError("未找到建筑档案");
    },
  );

  server.registerTool(
    "wenxun_get_inspection",
    {
      title: "获取巡查报告数据",
      description:
        "根据巡查 ID 获取建筑、风险、规范引用、整改任务、证据、复核记录和状态，用于生成只读报告。",
      inputSchema: z.object({ inspectionId: z.string().min(1) }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ inspectionId }) => {
      const result = await getInspectionReport(inspectionId);
      return result ? toolResult(result) : toolError("未找到巡查记录");
    },
  );

  server.registerTool(
    "wenxun_list_rectification_tasks",
    {
      title: "列出整改任务",
      description:
        "分页查询整改任务，可以按任务状态或责任人邮箱过滤。返回期限、责任人、关联建筑和证据数量。",
      inputSchema: z
        .object({
          status: z.nativeEnum(TaskStatus).optional(),
          assigneeEmail: z.string().email().optional(),
          ...paginationSchema,
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => toolResult(await listRectificationTasks(input)),
  );

  return server;
}
