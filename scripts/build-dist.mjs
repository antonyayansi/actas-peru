import { spawnSync } from "node:child_process";
import { cpSync, existsSync, renameSync, rmSync } from "node:fs";

const api = "src/app/api";
const stash = "/tmp/actas-api-stash";
const envApartado = ".env.durante-el-build";
const env = { ...process.env, DIST_EXPORT: "1", NEXT_PUBLIC_ESTATICO: "1" };
delete env.FTP_PASSWORD;
delete env.FTP_USER;
delete env.EXTRACT_URL;
if (existsSync(".env")) renameSync(".env", envApartado);

function restaurarEnv() {
  if (existsSync(envApartado) && !existsSync(".env")) renameSync(envApartado, ".env");
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    restaurarEnv();
    process.exit(result.status ?? 1);
  }
}

run("npx", ["tsx", "scripts/escribir-indice.ts"]);

if (existsSync(stash)) rmSync(stash, { recursive: true, force: true });
renameSync(api, stash);
let buildStatus = 0;
try {
  const build = spawnSync("npx", ["next", "build"], { stdio: "inherit", env });
  buildStatus = build.status ?? 1;
} finally {
  if (existsSync(api)) rmSync(api, { recursive: true, force: true });
  renameSync(stash, api);
}
restaurarEnv();
if (buildStatus !== 0) process.exit(buildStatus);

rmSync("dist", { recursive: true, force: true });
cpSync("out", "dist", { recursive: true });
console.log("dist listo");
