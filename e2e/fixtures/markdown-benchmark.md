# Reading comfort sample

このノートは、Minimalテーマの読みやすさを複数の画面幅と配色で確認するためのサンプルです。見出し、本文、リンク、リスト、引用、表、コード、数式の間隔やコントラストを確認してください。

## Typography & links

日本語と English are mixed in this paragraph to compare glyph shape, line height, punctuation, and wrapping. **Bold text**, *italic text*, ~~strikethrough~~, ==highlight==, `inline code`, and a [web link](https://obsidian.md/) should remain easy to distinguish.

Wiki links should also read naturally: [[Minimal theme benchmark]] and [[A deliberately long note title for checking how links wrap on narrow screens]]. A tag is shown here: #visual-check.

## Lists & tasks

- First-level item with a short sentence.
- A longer item checks wrapping: the text should keep a clear hanging indent when it wraps onto another line in the narrow phone view.
  - Nested item one
  - Nested item two with **emphasis** and `code`

- [ ] Review contrast in light mode
- [x] Check that completed tasks remain legible
- [/] Check alternate checkbox states

## Quotes & callouts

> A blockquote should be visually distinct without making the text difficult to read.
>
> It can contain a second paragraph with [a link](https://obsidian.md/) and **strong text**.

> [!note] Informational callout
> This callout checks icon alignment, title spacing, and body text contrast.

> [!warning] Long callout title for narrow viewports
> The title and body should wrap cleanly without clipping or colliding with the icon.

> [!tip]- Collapsible callout
> This content should remain readable after expanding the callout.

## Tables & code

The table deliberately uses several columns so its behavior can be checked on a phone-width viewport.

| View | Width | Background | Text | Wrapping check | Status | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| Reading view | 1280 px | Primary | Japanese / English | A longer phrase wraps inside this cell | Ready | Desktop |
| Reading view | 390 px | Primary | 日本語 | Narrow layout should not overlap neighboring cells | Review | Mobile |
| Settings | 1280 px | Secondary | Controls | Labels and controls should align on one row where possible | Ready | Desktop |
| Settings | 390 px | Secondary | 設定項目 | Long labels should wrap without covering their controls | Review | Mobile |

```ts
type ThemeCheck = {
	viewport: "desktop" | "phone";
	colorScheme: "light" | "dark";
	readable: boolean;
};

const example: ThemeCheck = {
	viewport: "phone",
	colorScheme: "dark",
	readable: true,
};

console.log("Minimal theme benchmark", example);
```

## Math & footnotes

Inline math: $E = mc^2$.

Block math:

$$
\int_{a}^{b} f(x)\,dx = F(b) - F(a)
$$

The note ends with a footnote reference.[^contrast]

[^contrast]: Check small secondary text against both the note background and surrounding UI.
