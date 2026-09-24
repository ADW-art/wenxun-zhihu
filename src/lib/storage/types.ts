import type { EvidenceSourceType } from "@prisma/client";

export const MAX_EVIDENCE_FILE_SIZE = 8 * 1024 * 1024;

export type SavedEvidenceFile = {
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sourceType: EvidenceSourceType;
  exifStripped: boolean;
};

export interface FileStorage {
  saveEvidence(file: File, sourceType?: EvidenceSourceType): Promise<SavedEvidenceFile>;
  read(storageKey: string): Promise<{
    bytes: Buffer;
    mimeType: string;
    sizeBytes: number;
  }>;
}
