import fs from "fs";
import path from "path";

export function dataFile(...parts: string[]): string {
  return path.join(process.cwd(), "data", ...parts);
}

export function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

export const SNAPSHOT_PATH = dataFile("snapshot.json");
export const SNAPSHOT_PREV_PATH = dataFile("snapshot.prev.json");
export const STATE_PATH = dataFile("state.json");
export const MANIFEST_PATH = dataFile("manifest.json");
export const SEED_PATH = dataFile("raw", "listing-observed-2026-11-05.json");
