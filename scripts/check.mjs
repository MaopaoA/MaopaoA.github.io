import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import matter from 'gray-matter';
const root=path.resolve('_site');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(root).filter(f=>f.endsWith('.html'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const sources=walk('_posts').filter(f=>f.endsWith('.md')).filter(f=>matter(fs.readFileSync(f,'utf8')).data.published!==false);
assert.equal(manifest.length,sources.length,'Every published work is included');
assert.equal(new Set(manifest.map(p=>p.url)).size,manifest.length,'Article addresses are unique');
for(const file of files){const html=fs.readFileSync(file,'utf8');assert.match(html,/<html lang="zh-CN">/);assert.match(html,/<main id="main"[^>]*>/);assert.match(html,/<h1[\s>]/,`Missing title: ${file}`);assert(!html.includes('{%'),'No unresolved Liquid markup');for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){const target=path.join(root,decodeURIComponent(match[1]));assert(fs.existsSync(target)||fs.existsSync(path.join(target,'index.html')),`Broken internal URL ${match[1]} in ${file}`);}}
for(const p of manifest){const html=fs.readFileSync(path.join(root,p.url,'index.html'),'utf8');assert(html.includes('class="prose"'));assert(html.includes(p.title));const settings=JSON.parse(html.match(/id="comment-settings">([^<]+)/)[1]);assert.equal(settings.path,encodeURI(p.url),'Legacy comment thread retained');}
const sample=fs.readFileSync(path.join(root,'posts/literature/栗子/index.html'),'utf8');assert(sample.includes('<br>'),'Poetry line breaks preserved');
const profile=fs.readFileSync('content/profile.md','utf8').trim();
for(const url of ['index.html','about/index.html']) assert(fs.readFileSync(path.join(root,url),'utf8').includes(profile),'Original introduction preserved verbatim');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(home.includes('home-three-col'),'Original three-column layout restored');
assert(home.includes('/image/avatar.png'),'Original avatar restored');
assert(home.includes('/image/星合之空.png'),'Original background restored');
assert(home.includes('class="masthead-title"'),'Original masthead restored');
assert(!home.includes('poole.min.css')&&!home.includes('lanyon.min.css'),'No legacy framework dependency');
for(const banned of ['世界的另一种','在故事里寻找真实','重新理解我们自己','当机器开始思考','我们如何理解','另一条探索','一些微小而遥远','THE QUIET OF LOOKING'])assert(!home.includes(banned),`Removed invented homepage copy: ${banned}`);
const search=JSON.parse(fs.readFileSync(path.join(root,'search-index.json')));assert.equal(search.length,manifest.length);assert(search.find(p=>p.title==='失忆').text.includes('索尼'),'Search includes the complete article, not just an excerpt');
assert(fs.readFileSync(path.join(root,'research/index.html'),'utf8').includes('暂无文章。'));
for(const kind of ['fiction','poetry','research']){const xml=fs.readFileSync(path.join(root,`feeds/${kind}.xml`),'utf8');assert.equal((xml.match(/<entry>/g)||[]).length,manifest.filter(p=>p.kind===kind).length);}
console.log(`Verified ${files.length} pages: original intro and works, internal links, comment paths, full-text index, category feeds, removed homepage copy.`);
