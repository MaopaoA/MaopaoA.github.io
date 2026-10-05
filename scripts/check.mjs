import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('_site');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(root).filter(f=>f.endsWith('.html'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
assert.equal(manifest.length,walk('_posts').filter(f=>f.endsWith('.md')).length,'Every original work is published');
assert.equal(new Set(manifest.map(p=>p.url)).size,manifest.length,'Article addresses are unique');
for(const file of files){const html=fs.readFileSync(file,'utf8');assert.match(html,/<html lang="zh-CN">/);assert.match(html,/<main id="main">/);assert.match(html,/<h1[\s>]/,`Missing title: ${file}`);assert(!html.includes('{%'),'No unresolved Liquid markup');for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){const target=path.join(root,decodeURIComponent(match[1]));assert(fs.existsSync(target)||fs.existsSync(path.join(target,'index.html')),`Broken internal URL ${match[1]} in ${file}`);}}
for(const p of manifest){const html=fs.readFileSync(path.join(root,p.url,'index.html'),'utf8');assert(html.includes('class="prose"'));assert(html.includes(p.title));}
const sample=fs.readFileSync(path.join(root,'posts/literature/栗子/index.html'),'utf8');assert(sample.includes('<br>'),'Poetry line breaks preserved');
console.log(`Verified ${files.length} pages: original works, unique addresses, internal links, poetry formatting, document structure.`);
