import { readFileSync } from "fs";
import { extractText } from "unpdf";
import { parseActa } from "../src/lib/parser";
import { fixtureCatalog } from "../tests/helpers";

async function main() {
  const catalog = fixtureCatalog();
  for (const [index, name] of ["distrital", "provincial", "regional"].entries()) {
    const bytes = new Uint8Array(readFileSync(`/tmp/erm-probe/pdfs/sample${index}.pdf`));
    const { text } = await extractText(bytes, { mergePages: true });
    const parsed = parseActa(String(text), catalog);
    const json = JSON.stringify(parsed);
    console.log(`\n== ${name} dni=${/\b\d{8}\b/.test(json)} ==`);
    console.log(JSON.stringify(parsed, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
