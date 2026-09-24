import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalFileStorage } from "./local";

const temporaryDirectories: string[] = [];

async function createStorage() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "wenxun-storage-"));
  temporaryDirectories.push(directory);
  return new LocalFileStorage(directory);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("LocalFileStorage", () => {
  it("saves and reads an allowed text file", async () => {
    const storage = await createStorage();
    const file = new File(["现场记录"], "record.txt", {
      type: "text/plain",
    });

    const saved = await storage.saveEvidence(file);
    const loaded = await storage.read(saved.storageKey);

    expect(saved.originalName).toBe("record.txt");
    expect(saved.exifStripped).toBe(false);
    expect(loaded.bytes.toString("utf8")).toBe("现场记录");
  });

  it("rejects an unsupported MIME type", async () => {
    const storage = await createStorage();
    const file = new File(["binary"], "archive.zip", {
      type: "application/zip",
    });

    await expect(storage.saveEvidence(file)).rejects.toThrow(
      "仅支持 JPG、PNG、WebP、PDF 和纯文本文件",
    );
  });

  it("rejects a path traversal read", async () => {
    const storage = await createStorage();

    await expect(storage.read("../secret.txt")).rejects.toThrow("非法文件路径");
  });
});
