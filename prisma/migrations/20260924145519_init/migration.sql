-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INSPECTOR', 'RECTIFIER', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BuildingStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ANALYZING', 'PENDING_REVIEW', 'RECTIFYING', 'PENDING_CLOSURE', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('FIRE', 'ELECTRICAL', 'WATER', 'STRUCTURE', 'VEGETATION', 'HUMAN_ACTIVITY', 'MATERIAL_DETERIORATION', 'TOURIST_PRESSURE', 'CONSTRUCTION_IMPACT', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('PHOTO', 'DOCUMENT', 'NOTE');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('SELF_CAPTURED', 'CC0', 'CC_BY', 'PUBLIC_DOMAIN', 'AI_SYNTHETIC', 'PERMISSION_GRANTED', 'PROJECT_GENERATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('CONFIRM_FINDING', 'REJECT_FINDING', 'CREATE_TASK', 'APPROVE_TASK', 'REJECT_TASK', 'CLOSE_INSPECTION', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'DEGRADED');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "StandardSourceType" AS ENUM ('PUBLIC_STANDARD', 'PROJECT_RULE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "addressLabel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "riskTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "BuildingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingRiskHistory" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "riskType" "RiskType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "summary" TEXT NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildingRiskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "season" TEXT NOT NULL,
    "weather" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "plannedFor" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionEvidence" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT,
    "externalUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "altText" TEXT,
    "sourceType" "EvidenceSourceType" NOT NULL DEFAULT 'UNKNOWN',
    "licenseNote" TEXT,
    "exifStripped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskType" "RiskType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'PROPOSED',
    "confidence" DOUBLE PRECISION,
    "uncertainty" TEXT,
    "recommendedAction" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardDocument" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "sourceType" "StandardSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardClause" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "clauseCode" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "riskTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "buildingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isOfficialText" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FindingCitation" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "relevance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FindingCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RectificationTask" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acceptanceCriteria" TEXT NOT NULL,
    "priority" "RiskSeverity" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RectificationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEvidence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "description" TEXT NOT NULL,
    "originalName" TEXT,
    "storageKey" TEXT,
    "externalUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL DEFAULT 'SELF_CAPTURED',
    "licenseNote" TEXT,
    "exifStripped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRecord" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT,
    "findingId" TEXT,
    "taskId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'RUNNING',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "toolSchemaVersion" TEXT NOT NULL,
    "inputJson" JSONB NOT NULL,
    "outputJson" JSONB,
    "degraded" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelCall" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCall" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "argumentsJson" JSONB NOT NULL,
    "resultJson" JSONB,
    "status" "CallStatus" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadataJson" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Building_code_key" ON "Building"("code");

-- CreateIndex
CREATE INDEX "BuildingRiskHistory_buildingId_happenedAt_idx" ON "BuildingRiskHistory"("buildingId", "happenedAt");

-- CreateIndex
CREATE INDEX "Inspection_buildingId_createdAt_idx" ON "Inspection"("buildingId", "createdAt");

-- CreateIndex
CREATE INDEX "Inspection_inspectorId_status_idx" ON "Inspection"("inspectorId", "status");

-- CreateIndex
CREATE INDEX "InspectionEvidence_inspectionId_createdAt_idx" ON "InspectionEvidence"("inspectionId", "createdAt");

-- CreateIndex
CREATE INDEX "Finding_inspectionId_status_idx" ON "Finding"("inspectionId", "status");

-- CreateIndex
CREATE INDEX "Finding_riskType_severity_idx" ON "Finding"("riskType", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "StandardDocument_code_key" ON "StandardDocument"("code");

-- CreateIndex
CREATE INDEX "StandardClause_isOfficialText_idx" ON "StandardClause"("isOfficialText");

-- CreateIndex
CREATE UNIQUE INDEX "StandardClause_documentId_clauseCode_key" ON "StandardClause"("documentId", "clauseCode");

-- CreateIndex
CREATE UNIQUE INDEX "FindingCitation_findingId_clauseId_key" ON "FindingCitation"("findingId", "clauseId");

-- CreateIndex
CREATE INDEX "RectificationTask_assigneeId_status_idx" ON "RectificationTask"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "RectificationTask_dueAt_status_idx" ON "RectificationTask"("dueAt", "status");

-- CreateIndex
CREATE INDEX "TaskEvidence_taskId_createdAt_idx" ON "TaskEvidence"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewRecord_actorId_createdAt_idx" ON "ReviewRecord"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_inspectionId_startedAt_idx" ON "AgentRun"("inspectionId", "startedAt");

-- CreateIndex
CREATE INDEX "AgentRun_status_startedAt_idx" ON "AgentRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "ModelCall_agentRunId_createdAt_idx" ON "ModelCall"("agentRunId", "createdAt");

-- CreateIndex
CREATE INDEX "ToolCall_agentRunId_createdAt_idx" ON "ToolCall"("agentRunId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "BuildingRiskHistory" ADD CONSTRAINT "BuildingRiskHistory_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionEvidence" ADD CONSTRAINT "InspectionEvidence_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardClause" ADD CONSTRAINT "StandardClause_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StandardDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingCitation" ADD CONSTRAINT "FindingCitation_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingCitation" ADD CONSTRAINT "FindingCitation_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "StandardClause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RectificationTask" ADD CONSTRAINT "RectificationTask_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RectificationTask" ADD CONSTRAINT "RectificationTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RectificationTask" ADD CONSTRAINT "RectificationTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RectificationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvidence" ADD CONSTRAINT "TaskEvidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RectificationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCall" ADD CONSTRAINT "ModelCall_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCall" ADD CONSTRAINT "ToolCall_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
