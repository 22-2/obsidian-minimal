import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export default async function globalSetup() {
	const cssRoot = path.join(repoRoot, "src", "css");
	const compiled = sass.compile(path.join(repoRoot, "src", "scss", "index.scss"), { style: "expanded" }).css;
	const outputDir = path.join(repoRoot, ".ci-artifacts", "e2e-theme", "Minimal");
	const cssParts = await Promise.all([
		readFile(path.join(cssRoot, "license.css"), "utf8"),
		Promise.resolve(compiled),
		readFile(path.join(cssRoot, "plugin-compatibility.css"), "utf8"),
		readFile(path.join(cssRoot, "style-settings.css"), "utf8"),
	]);

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "theme.css"), cssParts.join("\n"));
}
