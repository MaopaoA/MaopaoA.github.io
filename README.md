# Maopao's blog

Live site: https://maopaoa.github.io/

The original snowy background, Times New Roman typography, centered masthead, avatar, Spotify player, and three-column homepage are rendered by the new Node system. The visual reference is the original repository at commit `b145be4`. Jekyll and the old theme framework are not used to build or display the site.

The homepage keeps Archive / Latest / Literary & Profile; Literary Creation keeps its fiction-and-poetry columns. The right-hand menu contains navigation and full-text search. Articles retain reading controls, dark mode, and comments. RSS supports all posts and individual categories.

## Add an article

```sh
npm ci
npm run new -- --kind fiction --title "文章标题" --tags "标签1,标签2"
```

Use `fiction`, `poetry`, or `research` for `--kind`. The command creates a dated Markdown file in the appropriate `_posts` folder and refuses to overwrite an existing file. Optional flags:

- `--featured`: show the article in the homepage's Archive column
- `--draft`: create it with `published: false`, so it stays out of the website, search, and feeds
- `--date YYYY-MM-DD`: choose the publication date

Edit the created file and write the article below its front matter. Or create a Markdown file yourself:

```yaml
---
title: 文章标题
date: 2026-10-05
kind: research
tags: [标签1, 标签2]
featured: true
published: true
# Optional: description (your own excerpt), permalink (a stable article address)
---
```

Folders: `_posts/literature/novel/` for fiction, `_posts/literature/poem/` for poetry, `_posts/research/` for research. Without `kind`, the folder sets the category. Remove `featured: true` to unfeature an article. Set `published: false` to hide a draft. Draft files committed to this public repository are still publicly accessible on GitHub; this flag only excludes them from the rendered blog.

Existing articles and their addresses remain unchanged. A leading Markdown `#` title is optional and is omitted from the reader to prevent a duplicate heading. Poetry supports hard line breaks (two trailing spaces). Articles support code blocks, tables, links, and `$...$` / `$$...$$` math.

## Update the profile and featured list

`content/profile.md` contains the original self-introduction, verbatim. Edit this file to update both the homepage and About page.

`site.config.json` controls the masthead title, original background and locally stored avatar, profile location, social links, Spotify track, and homepage featured list. Add or remove an article's path under `featured`. Articles marked `featured: true` in their own front matter are also shown in Archive. If no articles are featured, Archive shows three older posts and Latest shows the three newest posts. No template changes are required.

## Preview and publish

```sh
npm run dev       # http://127.0.0.1:4173
npm run publish   # Builds, checks, and copies the final site to the publishing root
git add .
git commit -m "Update blog"
git push origin master
```

GitHub Pages publishes from `master` / root. `.nojekyll` serves compiled HTML directly; Ruby and Jekyll are not needed. The verification workflow checks that committed output matches the source.

## Comments and subscriptions

Comments reuse the existing Valine / LeanCloud configuration from `_config.yml`, including app settings and the original URL-based thread identifiers. Valine and its LeanCloud SDK are bundled locally and load when a reader chooses to view or write comments. The configuration uses the verified current API endpoint for the existing account. Existing comments remain stored in your existing service. Manage them through the same LeanCloud account. `valine.serverURLs` can be set in `_config.yml` if the service uses a custom API domain.

`/subscribe` provides a copyable RSS address and links to category feeds. The all-posts feed remains at `/atom.xml`; category feeds are `/feeds/fiction.xml`, `/feeds/poetry.xml`, and `/feeds/research.xml`. All feeds contain the article's full text.

## Development

- `scripts/build.mjs`: Markdown rendering, pages, feeds, sitemap, full-text search index
- `scripts/presentation.mjs`: restored masthead, menu, homepage, profile, and literature layout
- `assets/site.css`: responsive layouts and typography
- `assets/site.js`: search, filters, reader settings, subscription controls, comments
- `npm test`: original profile preservation, article coverage, links, comment thread identifiers, full-text search data, category feeds, and an isolated author workflow test for creation, tags, drafts, featuring, and research math
- `node scripts/browser-check.mjs`: browser checks at five screen widths, reading controls, search, comments UI, and subscriptions. Run `npx playwright install chromium` first if no browser is installed. `CHROMIUM_PATH` can select an existing Chromium.

Historical theme files and the original LICENSE remain. The previous site was based on [wu-kan/wu-kan.github.io](https://github.com/wu-kan/wu-kan.github.io). Unless otherwise stated, writing is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh). Noto Serif SC has native Songti fallbacks. KaTeX and Valine assets retain their bundled licenses.

The main navigation has two subject sections: Literary Creation (fiction and poetry) and Math & AI (the `research` category, including mathematics). Existing `/math` links redirect to `/research`; the retired `/career` page redirects to the archive.

## Reading and sharing

On narrow screens, Literary Creation switches between novels/essays and poetry at the top of the page; `/literature#poems` opens poetry directly. Desktop retains both columns. Poetry and prose remember separate font sizes. Poetry preserves stanza breaks and spaces; prose uses a flush-left opening paragraph followed by two-character indentation at every screen size.

Sharing uses the article title, canonical URL, the author-provided `description` (or the original opening line), and `/image/share.png`. Set `share_image: /image/your-cover.png` in an article’s front matter to use a custom raster cover. No generated summaries are added. Native sharing is used when available; otherwise the share button copies the link.

`node scripts/reading-check.mjs` checks mobile reading and navigation using the local preview (port 4179 by default; override with `SITE_URL`). Start it with `PORT=4179 node scripts/serve.mjs`.

The desktop snow background covers the viewport and is painted on the root canvas. Compact screens use an edge-to-edge reading layout with snow only in the masthead; touch landscape screens keep this layout. Vertical overscroll is disabled on the root, while wide tables, code and equations scroll within the article.
