import { defineObsidianConfig } from "obsidian-e2e-toolkit";

export default defineObsidianConfig({
	testDir: "./e2e",
	testMatch: "theme-visual.spec.mjs",
	timeout: 120_000,
	expect: { timeout: 10_000 },
	workers: 1,
	reporter: [["list"], ["html", { open: "never" }]],
	globalSetup: "./e2e/global-setup.mjs",
	use: { headless: true },
});
