# Maopao · 写作与研究

A bilingual literary journal for fiction, poetry, and research on artificial intelligence. Warm paper, serif typography, vermilion accents, and original vector illustrations frame the work. Responsive reading pages include persistent dark mode, adjustable type size, and a reading progress indicator.

Live site: https://maopaoa.github.io/

## Writing and publishing

All 14 original works remain in `_posts`, unchanged. Create new Markdown files in:

- `_posts/literature/novel/` for fiction
- `_posts/literature/poem/` for poetry
- `_posts/research/` for AI research and observations

Use a filename such as `2026-10-05-文章标题.md` and this front matter:

```yaml
---
title: 文章标题
date: 2026-10-05
# Optional: description, permalink
---
```

Write the article below the front matter. A leading `#` title is optional and omitted from the reader to prevent a duplicate title. Poetry supports Markdown hard line breaks (two trailing spaces). Research supports `$...$` inline math and `$$...$$` display math through KaTeX, code blocks, tables, and footnotes written as ordinary Markdown links. Dates come from your front matter; existing filename/date differences are preserved.

```sh
npm ci
npm run dev       # Preview at http://127.0.0.1:4173
npm run publish   # Build, validate, and copy the final site to the publishing root
git add .
git commit -m "Publish new writing"
git push origin master
```

GitHub Pages continues to publish from `master` / root. The committed `.nojekyll` file serves the compiled HTML directly. No Jekyll or Ruby installation is needed. The verification workflow checks the build and requires committed output to match source. The old Jekyll files remain for reference, but are no longer used for rendering. Existing `/posts/literature/...` article addresses are retained; `/math`, `/career`, `/resume`, `/tags`, and `/comments` lead to their new destinations.

## Development

- `scripts/build.mjs`: Markdown rendering, pages, Atom feed, sitemap, metadata
- `assets/site.css`: visual design and responsive styles
- `assets/site.js`: archive search, filters, reading controls, theme, progress
- `npm test`: source coverage, all internal links, unique article addresses, poetry formatting, HTML structure
- `npx playwright install chromium` then `node scripts/browser-check.mjs`: five viewport sizes and browser interactions. Set `CHROMIUM_PATH` to use an existing Chromium installation.

The AI research collection stays empty until you publish your own work. Site copy uses existing profile information and themes from the writing; no research, credentials, or achievements have been invented.

## Credits and licensing

The original site was based on [wu-kan/wu-kan.github.io](https://github.com/wu-kan/wu-kan.github.io). Historical theme files and the original LICENSE are retained. Unless otherwise stated, writing is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh). The Chinese serif webfont is Noto Serif SC, with native Songti fallbacks; the site remains usable without external fonts. KaTeX font assets are bundled locally.
