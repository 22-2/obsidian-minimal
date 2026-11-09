# Minimal theme visual E2E

Run `pnpm run e2e:shots` to compile the current SCSS into an isolated test theme, launch the pinned Obsidian version, and capture Markdown and Appearance settings views.

The first run downloads the Obsidian E2E app assets. Screenshots are saved to `.ci-artifacts/ui-screenshots/`; the Playwright HTML report is saved to `playwright-report/`.

The benchmark note at `e2e/fixtures/markdown-benchmark.md` covers typography, links, lists, callouts, quotes, tables, code, math, and footnotes. The suite captures it at desktop and 390px widths in light and dark mode, and with each Bearded dark scheme. Appearance settings are captured at desktop width for light, dark, and each Bearded dark scheme.

Set `MINIMAL_THEME_SCREENSHOT_ROOT` to save screenshots outside the default `.ci-artifacts/ui-screenshots/` folder.
