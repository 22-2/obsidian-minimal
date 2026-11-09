import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "obsidian-e2e-toolkit";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const notePath = "E2E/Minimal theme benchmark.md";
const screenshotRoot = process.env.MINIMAL_THEME_SCREENSHOT_ROOT ?? path.join(repoRoot, ".ci-artifacts", "ui-screenshots");
const colorSchemes = ["light", "dark"];
const viewports = {
	pc: { width: 1280, height: 900 },
	mobile: { width: 390, height: 844 },
};
const beardedDarkSchemes = [
	{ id: "minimal-bearded-aquarelle-hydrangea-dark", name: "Bearded Theme Aquarelle Hydrangea" },
	{ id: "minimal-bearded-black-amethyst-soft-dark", name: "Bearded Theme Black & Amethyst Soft" },
	{ id: "minimal-bearded-black-emerald-dark", name: "Bearded Theme Black & Emerald" },
	{ id: "minimal-bearded-black-gold-dark", name: "Bearded Theme Black & Gold" },
	{ id: "minimal-bearded-black-ruby-dark", name: "Bearded Theme Black & Ruby" },
	{ id: "minimal-bearded-coffee-dark", name: "Bearded Theme Coffee" },
	{ id: "minimal-bearded-hc-wonderland-wood-dark", name: "Bearded Theme HC Wonderland Wood" },
	{ id: "minimal-bearded-themanopia-dark", name: "Bearded Themanopia (Experimental)" },
	{ id: "minimal-bearded-vivid-purple-dark", name: "Bearded Theme Vivid Purple" },
];

async function preparePage(obsidian, page, device, colorScheme) {
	await page.setViewportSize(viewports[device]);
	await obsidian.setTheme(colorScheme, page);
	await expect(page.locator("body")).toHaveClass(new RegExp(`\\btheme-${colorScheme}\\b`));
}

async function capture(page, testInfo, outputPath, name) {
	await mkdir(path.dirname(outputPath), { recursive: true });
	await page.screenshot({ path: outputPath, animations: "disabled" });
	await testInfo.attach(name, { path: outputPath, contentType: "image/png" });
}

async function applyDarkScheme(page, schemeId) {
	await page.locator("body").evaluate((body, selectedScheme) => {
		for (const className of Array.from(body.classList)) {
			if (className.startsWith("minimal-bearded-") && className.endsWith("-dark")) {
				body.classList.remove(className);
			}
		}
		body.classList.add(selectedScheme);
	}, schemeId);
}

async function scrollToHeading(page, heading) {
	await page.getByRole("heading", { name: heading, exact: true }).evaluate((element) => {
		element.scrollIntoView({ block: "start" });
	});
}

function themePicker(page) {
	const themesRow = page.locator(".setting-item").filter({
		has: page.locator(".setting-item-name").getByText("Themes", { exact: true }),
	});
	return themesRow.locator("select.dropdown:not(.is-measuring)");
}

test.use({ vaultOptions: { obsidianCli: "off" } });

test("captures the Minimal benchmark note and Appearance settings", async ({ obsidian }, testInfo) => {
	test.setTimeout(600_000);
	const themeSource = path.join(repoRoot, ".ci-artifacts", "e2e-theme", "Minimal", "theme.css");
	const benchmark = await readFile(path.join(repoRoot, "e2e", "fixtures", "markdown-benchmark.md"), "utf8");
	const themeFolder = path.join(await obsidian.vaultPath(), await obsidian.configDir(), "themes", "Minimal");
	await mkdir(themeFolder, { recursive: true });
	await copyFile(themeSource, path.join(themeFolder, "theme.css"));
	const themeManifest = JSON.parse(await readFile(path.join(repoRoot, "manifest.json"), "utf8"));
	delete themeManifest.id;
	await writeFile(path.join(themeFolder, "manifest.json"), `${JSON.stringify(themeManifest, null, "\t")}\n`);
	// The toolkit creates and opens its temporary vault after app startup, so refresh the theme list now.
	await obsidian.evaluateApp(async () => {
		await app.customCss.readThemes();
		await app.customCss.setTheme("Minimal");
	});
	await obsidian.createNote(notePath, benchmark);
	await obsidian.open(notePath);
	await obsidian.collapseSidebars();

	const notePage = obsidian.page;
	if (!(await notePage.locator(".markdown-preview-view").isVisible())) {
		await obsidian.command("markdown:toggle-preview");
	}
	await expect(notePage.locator(".markdown-preview-view")).toBeVisible();
	const themeSettingsPage = await obsidian.openSettings("appearance");
	const initialThemePicker = themePicker(themeSettingsPage);
	const availableThemes = await initialThemePicker.locator("option").evaluateAll((options) => options.map((option) => ({ label: option.textContent?.trim(), value: option.value })));
	const minimalTheme = availableThemes.find(({ label }) => label === "Minimal");
	if (!minimalTheme) throw new Error(`Minimal theme is missing from Appearance options: ${JSON.stringify(availableThemes)}`);
	await initialThemePicker.selectOption({ value: minimalTheme.value });
	await expect(initialThemePicker).toHaveValue("Minimal");
	await obsidian.closeSettings();

	for (const device of Object.keys(viewports)) {
		for (const colorScheme of colorSchemes) {
			await preparePage(obsidian, notePage, device, colorScheme);
			await obsidian.waitForAnimations(notePage);
			const basePath = path.join(screenshotRoot, device, colorScheme);
			await notePage.locator(".markdown-preview-view").evaluate((view) => { view.scrollTop = 0; });
			await capture(notePage, testInfo, path.join(basePath, "markdown-overview.png"), `${device} ${colorScheme} Markdown overview`);

			for (const heading of ["Quotes & callouts", "Tables & code"]) {
				await scrollToHeading(notePage, heading);
				await obsidian.waitForAnimations(notePage);
				const fileName = heading === "Quotes & callouts" ? "markdown-callouts.png" : "markdown-table-code.png";
				await capture(notePage, testInfo, path.join(basePath, fileName), `${device} ${colorScheme} ${heading}`);
			}

			if (colorScheme === "dark") {
				for (const scheme of beardedDarkSchemes) {
					await applyDarkScheme(notePage, scheme.id);
					await notePage.locator(".markdown-preview-view").evaluate((view) => { view.scrollTop = 0; });
					await obsidian.waitForAnimations(notePage);
					const schemePath = path.join(basePath, scheme.id.replace(/^minimal-/, "").replace(/-dark$/, ""));
					await capture(notePage, testInfo, path.join(schemePath, "markdown-overview.png"), `${device} ${scheme.name} Markdown overview`);

					for (const heading of ["Quotes & callouts", "Tables & code"]) {
						await scrollToHeading(notePage, heading);
						await obsidian.waitForAnimations(notePage);
						const fileName = heading === "Quotes & callouts" ? "markdown-callouts.png" : "markdown-table-code.png";
						await capture(notePage, testInfo, path.join(schemePath, fileName), `${device} ${scheme.name} ${heading}`);
					}

					if (device === "pc") {
						const settingsPage = await obsidian.openSettings("appearance");
						await preparePage(obsidian, settingsPage, device, colorScheme);
						await applyDarkScheme(settingsPage, scheme.id);
						await expect(settingsPage.locator(".vertical-tab-content")).toContainText(/themes/i);
						await obsidian.waitForAnimations(settingsPage);
						await capture(settingsPage, testInfo, path.join(schemePath, "appearance-settings.png"), `${scheme.name} Appearance settings`);
						await obsidian.closeSettings();
					}
				}
			}

			if (device === "pc") {
				const settingsPage = await obsidian.openSettings("appearance");
				await preparePage(obsidian, settingsPage, device, colorScheme);
				await expect(settingsPage.locator(".vertical-tab-content")).toContainText(/themes/i);
				await expect(themePicker(settingsPage)).toHaveValue("Minimal");
				await obsidian.waitForAnimations(settingsPage);
				await capture(settingsPage, testInfo, path.join(basePath, "appearance-settings.png"), `${colorScheme} Appearance settings`);
				await obsidian.closeSettings();
			}
		}
	}
});
