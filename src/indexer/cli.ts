import { startIndexer } from "./start";

const once = process.argv.includes("--once");
startIndexer({ once, signals: true });
