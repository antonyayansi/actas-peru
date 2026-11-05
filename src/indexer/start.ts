import fs from "fs";
import path from "path";
import { dataFile } from "../lib/store";
import { runCycle } from "./cycle";
import { intervalMinutes } from "./state";

const LOCK_DIR = dataFile("indexer.lock");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pidAlive(pid: number): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(): boolean {
  fs.mkdirSync(path.dirname(LOCK_DIR), { recursive: true });
  try {
    fs.mkdirSync(LOCK_DIR);
  } catch {
    const pid = Number(fs.readFileSync(path.join(LOCK_DIR, "pid"), "utf8"));
    if (pidAlive(pid) && pid !== process.pid) return false;
    fs.rmSync(LOCK_DIR, { recursive: true, force: true });
    fs.mkdirSync(LOCK_DIR);
  }
  fs.writeFileSync(path.join(LOCK_DIR, "pid"), String(process.pid));
  return true;
}

function releaseLock(): void {
  const pidFile = path.join(LOCK_DIR, "pid");
  try {
    const pid = Number(fs.readFileSync(pidFile, "utf8"));
    if (pid === process.pid) fs.rmSync(LOCK_DIR, { recursive: true, force: true });
  } catch {
    /* lock already gone */
  }
}

export function startIndexer(options?: { once?: boolean; signals?: boolean }): void {
  if (process.env.INDEX_ENABLED === "0") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const globalState = globalThis as { __ermIndexer?: boolean };
  if (globalState.__ermIndexer) return;
  if (!acquireLock()) {
    console.log("Indexación ya activa en otro proceso. Este servidor solo lee el índice.");
    return;
  }
  globalState.__ermIndexer = true;
  const stop = () => releaseLock();
  process.on("exit", stop);
  if (options?.signals) {
    process.on("SIGINT", () => {
      stop();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      stop();
      process.exit(0);
    });
  }

  const loop = async () => {
    do {
      try {
        await runCycle();
      } catch (error) {
        console.error("ciclo de indexación", error);
      }
      if (options?.once) break;
      const wait = intervalMinutes() * 60_000;
      console.log(`próxima sincronización en ${Math.round(wait / 60000)} min`);
      await sleep(wait);
    } while (!options?.once);
    if (options?.once) {
      releaseLock();
      globalState.__ermIndexer = false;
    }
  };
  void loop();
}
