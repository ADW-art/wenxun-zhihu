import path from "node:path";
import { env } from "@/lib/env";
import { LocalFileStorage } from "./local";
import type { FileStorage } from "./types";

let storage: FileStorage | undefined;

export function getFileStorage(): FileStorage {
  if (!storage) {
    storage = new LocalFileStorage(
      path.resolve(/* turbopackIgnore: true */ process.cwd(), env.STORAGE_LOCAL_DIR),
    );
  }
  return storage;
}
