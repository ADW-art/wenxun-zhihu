export type ClauseCandidate = {
  id: string;
  clauseCode: string;
  heading: string;
  text: string;
  riskTags: string[];
  buildingTypes: string[];
  isOfficialText: boolean;
  document: {
    id: string;
    code: string;
    title: string;
    publisher: string;
    sourceType: "PUBLIC_STANDARD" | "PROJECT_RULE";
    sourceUrl: string | null;
    version: string;
    effectiveDate: Date | null;
  };
};

export type RankedClause = ClauseCandidate & {
  score: number;
  matchReasons: string[];
};
