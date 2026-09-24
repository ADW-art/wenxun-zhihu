import type { ClauseCandidate, RankedClause } from "./types";

function normalizeTerms(value: string) {
  const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
  return Array.from(segmenter.segment(value))
    .filter((segment) => segment.isWordLike)
    .map((segment) => segment.segment.trim().toLowerCase())
    .filter((term) => term.length >= 2);
}

export function rankClauses({
  clauses,
  text,
  riskTags,
  buildingType,
  limit = 5,
}: {
  clauses: ClauseCandidate[];
  text: string;
  riskTags: string[];
  buildingType: string;
  limit?: number;
}): RankedClause[] {
  const queryTerms = new Set(normalizeTerms(`${text} ${riskTags.join(" ")}`));

  return clauses
    .map((clause) => {
      let score = 0;
      const matchReasons: string[] = [];

      const tagMatches = clause.riskTags.filter((tag) => riskTags.includes(tag));
      if (tagMatches.length > 0) {
        score += tagMatches.length * 4;
        matchReasons.push(`风险标签匹配：${tagMatches.join("、")}`);
      }

      if (clause.buildingTypes.includes(buildingType)) {
        score += 3;
        matchReasons.push("建筑类型匹配");
      }

      const clauseTerms = normalizeTerms(
        `${clause.heading} ${clause.text} ${clause.riskTags.join(" ")}`,
      );
      const lexicalMatches = clauseTerms.filter((term) => queryTerms.has(term));
      if (lexicalMatches.length > 0) {
        score += Math.min(lexicalMatches.length, 5);
        matchReasons.push(`文本匹配：${lexicalMatches.slice(0, 4).join("、")}`);
      }

      if (clause.isOfficialText) {
        score += 1;
        matchReasons.push("正式公开标准");
      } else {
        matchReasons.push("项目演示规则，非正式标准");
      }

      return {
        ...clause,
        score,
        matchReasons,
      };
    })
    .filter(
      (clause) => clause.score > 0 || clause.document.sourceType === "PUBLIC_STANDARD",
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
