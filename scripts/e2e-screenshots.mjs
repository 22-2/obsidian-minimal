import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const obsidianVersion = (await readFile(path.join(repoRoot, "e2e", "obsidian-version.txt"), "utf8")).trim();
const env = {
	...process.env,
	OBSIDIAN_E2E_TOOLKIT_HOME: repoRoot,
	OBSIDIAN_E2E_TOOLKIT_OBSIDIAN_VERSION: obsidianVersion,
};
let activeChild;
let interruptedBy;

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		interruptedBy = signal;
		activeChild?.kill(signal);
	});
}

function run(label, command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd: repoRoot, env, stdio: "inherit", windowsHide: true });
		activeChild = child;
		child.once("error", reject);
		child.once("exit", (code, signal) => {
			if (activeChild === child) activeChild = undefined;
			if (interruptedBy) {
				resolve(interruptedBy === "SIGINT" ? 130 : 143);
				return;
			}
			if (signal) reject(new Error(`${label} terminated by ${signal}`));
			else resolve(code ?? 1);
		});
	});
}

const toolkitSetup = path.join(repoRoot, "node_modules", "obsidian-e2e-toolkit", "scripts", "setup.mjs");
const playwrightCli = path.join(repoRoot, "node_modules", "@playwright", "test", "cli.js");

const setupExitCode = await run("Obsidian E2E setup", process.execPath, [toolkitSetup]);
if (setupExitCode !== 0) {
	process.exitCode = setupExitCode;
} else {
	const manifestPath = path.join(repoRoot, "manifest.json");
	const originalManifest = await readFile(manifestPath);
	const manifest = JSON.parse(originalManifest.toString("utf8"));
	const needsTemporaryId = !manifest.id;

	try {
		if (needsTemporaryId) {
			// The toolkit expects a plugin ID; provide one only while its Playwright config loads.
			await writeFile(manifestPath, `${JSON.stringify({ ...manifest, id: "minimal-theme-e2e" }, null, "\t")}\n`);
		}
		process.exitCode = await run("Minimal theme screenshot E2E", process.execPath, [playwrightCli, "test", "--config", "playwright.config.mjs"]);
	} finally {
		if (needsTemporaryId) await writeFile(manifestPath, originalManifest);
	}
}
