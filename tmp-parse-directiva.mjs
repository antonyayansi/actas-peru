import fs from "fs";

const html = fs.readFileSync("tmp-directiva.html", "utf8");
const cards = [...html.matchAll(/<h3 class="text-base font-bold mb-4">([^<]+)<\/h3>/g)].map((match) => match[1]);
const hrefs = [...html.matchAll(/href="(https:\/\/cdn\.www\.gob\.pe\/uploads\/document\/file\/[^"]+)"/g)].map((match) => match[1]);
const pages = [...html.matchAll(/href="(\/institucion\/contraloria\/[^"]+)"/g)].map((match) => match[1]);
const bits = [...html.matchAll(/href="(https:\/\/bit\.ly\/[^"]+|https:\/\/www\.gob\.pe\/[^"]+)"/g)].map((match) => match[1]);

console.log("CARDS", cards.length);
cards.forEach((card, index) => console.log(`${index + 1}. ${card}`));
console.log("---HREFS", new Set(hrefs).size);
[...new Set(hrefs)].forEach((href) => console.log(href));
console.log("---PAGES");
[...new Set(pages)].forEach((href) => console.log(href));
console.log("---GOB");
[...new Set(bits)].forEach((href) => console.log(href));
