import { describe, expect, it } from "vitest";
import { rankClauses } from "./rank";
import type { ClauseCandidate } from "./types";

const clauses: ClauseCandidate[] = [
  {
    id: "water-rule",
    clauseCode: "DEMO-WATER-01",
    heading: "排水与渗漏巡查",
    text: "暴雨后检查排水沟、墙脚和地下空间，记录积水和湿痕。",
    riskTags: ["water", "seepage", "heavy_rain"],
    buildingTypes: ["heritage_building"],
    isOfficialText: false,
    document: {
      id: "project-rules",
      code: "PROJECT-RULES-V1",
      title: "演示巡查规则",
      publisher: "项目组",
      sourceType: "PROJECT_RULE",
      sourceUrl: null,
      version: "1.0",
      effectiveDate: null,
    },
  },
  {
    id: "fire-standard",
    clauseCode: "1 范围",
    heading: "适用范围",
    text: "文物建筑防火设计规范，适用于文物建筑的防火设计。",
    riskTags: ["fire", "electrical"],
    buildingTypes: ["heritage_building"],
    isOfficialText: true,
    document: {
      id: "fire-doc",
      code: "WW/T 0125-2025",
      title: "文物建筑防火设计规范",
      publisher: "国家文物局",
      sourceType: "PUBLIC_STANDARD",
      sourceUrl: "https://example.com/fire",
      version: "2025",
      effectiveDate: new Date("2025-06-01"),
    },
  },
];

describe("rankClauses", () => {
  it("prioritizes clauses with matching risk tags", () => {
    const result = rankClauses({
      clauses,
      text: "暴雨后墙脚出现湿痕",
      riskTags: ["water", "seepage"],
      buildingType: "heritage_building",
    });

    expect(result[0]?.id).toBe("water-rule");
    expect(result[0]?.matchReasons.join(" ")).toContain("water");
  });

  it("keeps official source metadata available for citation", () => {
    const result = rankClauses({
      clauses,
      text: "配电线路存在火灾风险",
      riskTags: ["fire", "electrical"],
      buildingType: "heritage_building",
    });

    expect(result[0]?.document.code).toBe("WW/T 0125-2025");
    expect(result[0]?.isOfficialText).toBe(true);
  });

  it("respects the requested result limit", () => {
    const result = rankClauses({
      clauses,
      text: "文物建筑巡查",
      riskTags: ["water", "fire"],
      buildingType: "heritage_building",
      limit: 1,
    });

    expect(result).toHaveLength(1);
  });
});
