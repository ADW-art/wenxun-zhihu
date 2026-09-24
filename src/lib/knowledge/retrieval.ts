import { prisma } from "@/lib/prisma";
import { rankClauses } from "./rank";
import type { ClauseCandidate, RankedClause } from "./types";

export async function searchStandards({
  text,
  riskTags,
  buildingType,
  limit = 5,
}: {
  text: string;
  riskTags: string[];
  buildingType: string;
  limit?: number;
}): Promise<RankedClause[]> {
  const clauses = (await prisma.standardClause.findMany({
    include: {
      document: {
        select: {
          id: true,
          code: true,
          title: true,
          publisher: true,
          sourceType: true,
          sourceUrl: true,
          version: true,
          effectiveDate: true,
        },
      },
    },
  })) as ClauseCandidate[];

  return rankClauses({
    clauses,
    text,
    riskTags,
    buildingType,
    limit,
  });
}
