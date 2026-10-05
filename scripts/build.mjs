import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import {createPresentation} from './presentation.mjs';

const config = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const legacy = matter(`---\n${fs.readFileSync('_config.yml', 'utf8')}\n---`).data;
const out = path.resolve('_site');
const origin = config.url.replace(/\/$/, '');
const revision = createHash('sha256').update(['assets/site.css','assets/site.js','assets/theme.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n')).digest('hex').slice(0,10);
const md = new MarkdownIt({html: true, typographer: false}).use(texmath, {engine: katex, delimiters: 'dollars', katexOptions: {throwOnError: false}});
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeJSON = value => JSON.stringify(value).replace(/</g, '\\u003c');
const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]) : [];
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const labels = {fiction: '小说', poetry: '诗歌', research: 'AI 研究'};
const english = {fiction: 'FICTION', poetry: 'POETRY', research: 'AI RESEARCH'};
const collectionURL = {fiction: '/literature', poetry: '/poetry', research: '/research'};
const posts = walk('_posts').filter(p => p.endsWith('.md')).filter(file => matter(fs.readFileSync(file,'utf8')).data.published !== false).map(file => {
  const {data,content} = matter(fs.readFileSync(file,'utf8'));
  const kind = data.kind || (file.includes('/poem/') ? 'poetry' : file.includes('/novel/') ? 'fiction' : 'research');
  if (!labels[kind]) throw new Error(`Invalid kind in ${file}: use fiction, poetry, or research`);
  const body = content.replace(/^\s*#\s+[^\n]+\n/, '');
  const date = data.date instanceof Date ? data.date : new Date(String(data.date).replace(/^(\d{4})-(\d{1,2})-(\d{1,2}).*$/, (_,y,m,d) => `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T00:00:00Z`));
  if (!data.title || Number.isNaN(date.getTime())) throw new Error(`Missing title or invalid date: ${file}`);
  const category = file.includes('/literature/') ? 'literature' : file.split('/')[1];
  const slug = path.basename(file,'.md').replace(/^\d{4}-\d{1,2}-\d{1,2}-/, '').replace(/ /g,'-');
  const url = data.permalink || `/posts/${category}/${slug}`;
  if (!url.startsWith('/') || url.includes('..') || /[?#]/.test(url)) throw new Error(`Invalid permalink in ${file}`);
  const html = md.render(body);
  const excerpt = data.description || text(md.render(body.split('\n').filter(l => l.trim() && !/^\s*#/.test(l))[0] || ''));
  const tags = data.tags ? (Array.isArray(data.tags) ? data.tags : [data.tags]).map(String) : [];
  return {...data, file, date, kind, body, tags, excerpt, url, html, fulltext:text(html), minutes:Math.max(1,Math.ceil(body.replace(/\s/g,'').length/400))};
}).sort((a,b) => b.date-a.date || a.title.localeCompare(b.title,'zh'));
if (new Set(posts.map(p=>p.url)).size !== posts.length) throw new Error('Duplicate article addresses');
const date = p => p.date.toISOString().slice(0,10).replaceAll('-','.');
const arrow = '<span aria-hidden="true">↗</span>';
const profileHTML = md.render(fs.readFileSync(config.profile,'utf8'));
const featured = [...new Set([...posts.filter(p=>p.featured===true), ...config.featured.map(url=>posts.find(p=>p.url===url)).filter(Boolean)])];
const presentation = createPresentation({config, legacy, posts, featured, profileHTML, md, esc, labels, date, row});
const {nav, footer} = presentation;
function shell(title,content,{active='',url='/',description='Maopao 的博客：小说、诗歌与 AI 研究。',article=false}={}) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · Maopao</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#ffffff"><link rel="canonical" href="${origin}${esc(url)}"><meta property="og:title" content="${esc(title)} · Maopao"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:url" content="${origin}${esc(url)}"><link rel="icon" href="/image/icon.png" type="image/png"><link rel="alternate" type="application/atom+xml" title="Maopao" href="/atom.xml"><script src="/assets/theme.js?v=${revision}"></script><link rel="stylesheet" href="/assets/site.css?v=${revision}">${article?'<link rel="stylesheet" href="/assets/katex/katex.min.css">':''}<script src="/assets/site.js?v=${revision}" defer></script></head><body style="--site-background:url('${esc(config.background||'/image/星合之空.png')}')"><a class="skip-link" href="#main">跳至正文</a>${article?'<div class="reading-progress" aria-hidden="true"></div>':''}<div class="site-wrap">${nav(active)}<main id="main" class="content">${content}</main>${footer}</div></body></html>`;
}
function write(url,html) {const target = url.endsWith('.html') ? path.join(out,url) : path.join(out,url,'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);}
function row(p,i) {return `<a class="entry-row" href="${esc(p.url)}" data-kind="${p.kind}" data-url="${esc(p.url)}"><span class="entry-number">${String(i+1).padStart(2,'0')}</span><div class="entry-text"><h3>${esc(p.title)}</h3><p>${esc(p.excerpt.slice(0,95))}${p.excerpt.length>95?'…':''}</p>${p.tags.length?`<span class="entry-tags">${p.tags.map(esc).join(' · ')}</span>`:''}</div><div class="entry-meta"><span>${labels[p.kind]}</span><time datetime="${p.date.toISOString()}">${date(p)}</time></div><span class="entry-arrow" aria-hidden="true">↗</span></a>`;}
fs.mkdirSync(out,{recursive:true});
fs.cpSync('assets',path.join(out,'assets'),{recursive:true});
fs.mkdirSync(path.join(out,'assets/katex'),{recursive:true});
fs.cpSync('node_modules/katex/dist/fonts',path.join(out,'assets/katex/fonts'),{recursive:true});
fs.copyFileSync('node_modules/katex/dist/katex.min.css',path.join(out,'assets/katex/katex.min.css'));
fs.copyFileSync('node_modules/katex/LICENSE',path.join(out,'assets/katex/LICENSE'));
fs.cpSync('image',path.join(out,'image'),{recursive:true});
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.copyFileSync('node_modules/valine/dist/Valine.min.js',path.join(out,'assets/valine.min.js'));
fs.copyFileSync('node_modules/valine/LICENSE',path.join(out,'assets/valine.LICENSE'));
fs.copyFileSync('node_modules/leancloud-storage/dist/av-min.js',path.join(out,'assets/leancloud.min.js'));
fs.copyFileSync('node_modules/leancloud-storage/LICENSE',path.join(out,'assets/leancloud.LICENSE'));
write('/',shell('首页',presentation.home));
for (const kind of Object.keys(labels)) {
 const list=posts.filter(p=>p.kind===kind);const url=collectionURL[kind];
 if(kind==='fiction'){write(url,shell('Literary Creation',presentation.literature,{active:kind,url}));continue;}
 write(url,shell(labels[kind],`<section class="collection-head"><p class="eyebrow">${english[kind]} / ${list.length}</p><h1>${kind==='poetry'?'Poetry':'AI Research'}</h1><a class="collection-feed" href="/feeds/${kind}.xml">订阅此分类 ${arrow}</a></section>${list.length?`<div class="collection-list">${list.map(row).join('')}</div>`:'<p class="empty-state">暂无文章。</p>'}`,{active:kind,url}));
}
const tags=[...new Set(posts.flatMap(p=>p.tags))].sort((a,b)=>a.localeCompare(b,'zh'));
write('/archive',shell('全部文章',`<section class="collection-head"><p class="eyebrow">ARCHIVE / ${posts.length}</p><h1>全部文章</h1></section><div class="archive-tools"><div class="filters" role="group" aria-label="按类型筛选"><button class="active" aria-pressed="true" data-filter="all">全部 <span>${posts.length}</span></button>${Object.keys(labels).map(k=>`<button aria-pressed="false" data-filter="${k}">${labels[k]} <span>${posts.filter(p=>p.kind===k).length}</span></button>`).join('')}</div><label class="search-label" id="search"><span class="sr-only">搜索标题、正文或标签</span><input type="search" placeholder="搜索标题、正文或标签" aria-label="搜索标题、正文或标签"><span aria-hidden="true">⌕</span></label></div>${tags.length?`<div class="tag-filter"><label for="tag-select">标签</label><select id="tag-select"><option value="">全部标签</option>${tags.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></div>`:''}<p class="sr-only" id="result-count" aria-live="polite">${posts.length} 篇文章</p><div class="collection-list">${posts.map(row).join('')}</div><p class="search-empty" hidden>没有找到文章。</p><p class="search-error" hidden role="status">搜索暂时无法加载。请刷新重试。</p>`,{active:'archive',url:'/archive'}));
write('/about',shell('About',presentation.about,{active:'about',url:'/about'}));
write('/subscribe',shell('订阅',`<section class="collection-head"><p class="eyebrow">RSS</p><h1>订阅</h1></section><section class="subscription"><p>将订阅地址添加到你的 RSS 阅读器，即可接收新文章。</p><label for="feed-url">全部文章</label><div class="feed-address"><input id="feed-url" readonly value="${origin}/atom.xml" aria-label="RSS 订阅地址"><button data-copy-feed type="button">复制地址</button></div><p class="copy-status" role="status" aria-live="polite"></p><a class="text-link" href="/atom.xml">打开订阅源 ${arrow}</a><div class="category-feeds"><h2>按分类订阅</h2>${Object.keys(labels).map(k=>`<a href="/feeds/${k}.xml">${labels[k]} ${arrow}</a>`).join('')}</div></section>`,{url:'/subscribe'}));
const commentSettings=legacy.valine||{};
function comments(p) {
 if (!commentSettings.enable) return '';
 const settings={appId:commentSettings.appId,appKey:commentSettings.appKey,path:encodeURI(p.url),avatar:commentSettings.avatar||'identicon',lang:'zh-CN',placeholder:'发表评论',visitor:false,recordIP:commentSettings.recordIP??false, ...(commentSettings.serverURLs?{serverURLs:commentSettings.serverURLs}:{})};
 return `<section class="comments-section" id="comments"><h2>评论</h2><button class="load-comments" type="button">查看评论 / 写评论</button><p class="comment-status" role="status" aria-live="polite"></p><div id="comment-thread"></div><script type="application/json" id="comment-settings">${safeJSON(settings)}</script></section>`;
}
for (const p of posts) {
 const siblings=posts.filter(q=>q.kind===p.kind);const i=siblings.indexOf(p);const next=siblings[i+1]||siblings[i-1];
 write(p.url,shell(p.title,`<article class="reading-page ${p.kind==='poetry'?'poem-reading':''}"><header class="reading-head"><a class="eyebrow" href="${collectionURL[p.kind]}">← ${labels[p.kind]}</a><h1>${esc(p.title)}</h1><div class="reading-meta"><time datetime="${p.date.toISOString()}">${date(p)}</time><span>MAOPAO</span><span>约 ${p.minutes} 分钟</span><a href="#comments">评论</a></div>${p.tags.length?`<div class="reading-tags">${p.tags.map(t=>`<a href="/archive?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>`:''}<div class="reading-controls"><span>阅读字号</span><button data-font="smaller" aria-label="缩小阅读字号">A−</button><button data-font="larger" aria-label="放大阅读字号">A+</button></div></header><div class="prose">${p.html}</div><div class="reading-end"><span>· · ·</span><p>Maopao / ${p.date.getUTCFullYear()}</p></div><nav class="article-nav" aria-label="更多文章"><a href="/archive">← 全部文章</a>${next?`<a href="${esc(next.url)}"><small>下一篇</small>${esc(next.title)} →</a>`:''}</nav>${comments(p)}</article>`,{active:p.kind,url:p.url,description:p.excerpt.slice(0,150),article:true}));
}
write('/404.html',shell('页面不存在',`<section class="not-found"><p class="eyebrow">404</p><h1>页面不存在</h1><a class="text-link" href="/">返回首页 ${arrow}</a></section>`,{url:'/404.html'}));
for (const [old,to] of [['/resume','/about'],['/tags','/archive'],['/comments','/about']]) write(old,shell('页面已迁移',`<section class="not-found"><h1>页面已迁移</h1><a class="text-link" href="${to}">前往新页面 ${arrow}</a></section><script>location.replace(${safeJSON(to)})</script>`,{url:to}));
for(const [url,title,folder] of [['/math','Math','/math/'],['/career','Career Progression','/career/']]) {
 const list=posts.filter(p=>p.file.includes(folder));
 write(url,shell(title,`<section class="section-page"><header class="collection-head"><h1>${title}</h1></header>${list.length?`<div class="collection-list">${list.map(row).join('')}</div>`:'<p class="empty-state">暂无文章。</p>'}</section>`,{url}));
}
function feed(list,title,url) {
 const updated=list[0]?.date.toISOString()||'2026-10-05T00:00:00Z';
 return `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${esc(title)}</title><link href="${origin}${url}" rel="self"/><link href="${origin}/"/><id>${origin}${url}</id><updated>${updated}</updated><author><name>Maopao</name></author>${list.map(p=>`<entry><title>${esc(p.title)}</title><link href="${origin}${esc(encodeURI(p.url))}"/><id>${origin}${esc(encodeURI(p.url))}</id><updated>${p.date.toISOString()}</updated><category term="${p.kind}"/><content type="html">${esc(p.html)}</content></entry>`).join('')}</feed>`;
}
fs.writeFileSync(path.join(out,'atom.xml'),feed(posts,'Maopao','/atom.xml'));
fs.mkdirSync(path.join(out,'feeds'),{recursive:true});
for(const kind of Object.keys(labels)) fs.writeFileSync(path.join(out,`feeds/${kind}.xml`),feed(posts.filter(p=>p.kind===kind),`Maopao · ${labels[kind]}`,`/feeds/${kind}.xml`));
const urls=['/','/literature','/poetry','/research','/about','/archive','/subscribe','/math','/career',...posts.map(p=>p.url)];
fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${origin}${esc(encodeURI(u))}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(posts.map(({title,url,kind,tags})=>({title,url,kind,tags})),null,2));
fs.writeFileSync(path.join(out,'search-index.json'),JSON.stringify(posts.map(({title,url,kind,tags,fulltext})=>({title,url,kind,tags,text:fulltext})),null,2));
console.log(`Built ${posts.length} original works and ${urls.length} pages into _site.`);
