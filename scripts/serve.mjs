import { spawn } from "node:child_process";

const mode = process.argv[2] === "start" ? "start" : "dev";
const port = process.env.PORT || "43123";
const children = [
  spawn("npx", ["tsx", "src/indexer/cli.ts"], { stdio: "inherit" }),
  spawn("npx", ["next", mode, "-H", "0.0.0.0", "-p", port], { stdio: "inherit" }),
];

function stop() {
  for (const child of children) child.kill("SIGTERM");
}

process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});

children[1].on("exit", (code) => {
  stop();
  process.exit(code ?? 0);
});
