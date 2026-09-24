import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EvidenceSourceType } from "@prisma/client";
import sharp from "sharp";
import { ValidationError } from "@/lib/errors";
import type { FileStorage, SavedEvidenceFile } from "./types";
import { MAX_EVIDENCE_FILE_SIZE } from "./types";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const extensionByMimeType: Record<string, string> = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "image/webp": ".webp",
};

function evidenceDirectory() {
  const now = new Date();
  return path.join(
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
  );
}

export class LocalFileStorage implements FileStorage {
  constructor(private readonly rootDirectory: string) {}

  async saveEvidence(
    file: File,
    sourceType: EvidenceSourceType = "SELF_CAPTURED",
  ): Promise<SavedEvidenceFile> {
    if (!file.name || file.size === 0) {
      throw new ValidationError("上传文件为空");
    }
    if (file.size > MAX_EVIDENCE_FILE_SIZE) {
      throw new ValidationError("上传文件不能超过 8 MB");
    }
    if (!allowedMimeTypes.has(file.type)) {
      throw new ValidationError("仅支持 JPG、PNG、WebP、PDF 和纯文本文件");
    }

    const sourceBytes = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith("image/");
    const mimeType = isImage ? "image/webp" : file.type;
    const extension = extensionByMimeType[mimeType] ?? ".bin";
    const relativeDirectory = evidenceDirectory();
    const storageKey = path
      .join(
        /* turbopackIgnore: true */ relativeDirectory,
        `${randomUUID()}${extension}`,
      )
      .replaceAll("\\", "/");
    const absolutePath = path.join(this.rootDirectory, storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });

    const outputBytes = isImage
      ? await sharp(sourceBytes).rotate().webp({ quality: 88, effort: 4 }).toBuffer()
      : sourceBytes;

    await writeFile(absolutePath, outputBytes);

    return {
      originalName: path.basename(file.name),
      storageKey,
      mimeType,
      sizeBytes: outputBytes.byteLength,
      sourceType,
      exifStripped: isImage,
    };
  }

  async read(storageKey: string) {
    const root = path.resolve(this.rootDirectory);
    const absolutePath = path.resolve(root, storageKey);
    if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
      throw new ValidationError("非法文件路径");
    }

    const bytes = await readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const mimeType =
      extension === ".pdf"
        ? "application/pdf"
        : extension === ".txt"
          ? "text/plain; charset=utf-8"
          : "image/webp";

    return { bytes, mimeType, sizeBytes: bytes.byteLength };
  }
}
