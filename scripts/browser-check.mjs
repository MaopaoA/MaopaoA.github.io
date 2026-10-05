import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const cache=path.join(os.homedir(),'Library/Caches/ms-playwright');
const cached=fs.existsSync(cache)?fs.readdirSync(cache).filter(n=>n.startsWith('chromium-')).map(n=>path.join(cache,n,'chrome-mac/Chromium.app/Contents/MacOS/Chromium')).find(p=>fs.existsSync(p)):undefined;
const executable=process.env.CHROMIUM_PATH||(fs.existsSync(chromium.executablePath())?undefined:cached);
const browser=await chromium.launch(executable?{executablePath:executable}:{});
const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.SITE_URL||'http://127.0.0.1:4173';
if(process.argv.includes('--comments-only')){
 page.on('requestfailed',r=>{const u=new URL(r.url());console.log('Failed request:',u.hostname,u.pathname,r.failure()?.errorText);});
 page.on('response',r=>{const u=new URL(r.url());if(u.hostname!=='127.0.0.1')console.log('External response:',u.hostname,u.pathname,r.status());});
 await page.goto(base+'/posts/literature/栗子',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'查看评论 / 写评论'}).click();
 await page.waitForTimeout(20000);
 console.log('Comment state:',await page.locator('#comment-thread').innerText());
 console.log('JS errors:',errors);
 await browser.close();process.exit(0);
}

await page.goto(base+'/',{waitUntil:'networkidle'});
assert((await page.locator('.profile-text').innerText()).trim()===fs.readFileSync('content/profile.md','utf8').trim(),'Original introduction preserved verbatim');
assert.equal(await page.locator('.entry-row').count(),6);
await page.screenshot({path:'/tmp/maopao-desktop.png',fullPage:true});
for(const width of [320,375,390,768,1440]){
 await page.setViewportSize({width,height:900});
 for(const route of ['/','/archive','/subscribe','/about','/posts/literature/栗子']){
  await page.goto(base+route);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow at ${width} on ${route}`);
 }
}
await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await page.screenshot({path:'/tmp/maopao-mobile.png',fullPage:true});
await page.locator('#home-query').fill('IPS');await page.getByRole('button',{name:'搜索',exact:true}).click();
await page.waitForFunction(()=>document.querySelectorAll('.entry-row:not([hidden])').length===1);
assert((await page.locator('.entry-row:visible').innerText()).includes('失忆'),'Search finds a term deep inside the article');
await page.getByRole('searchbox').fill('');
await page.getByRole('button',{name:'诗歌'}).click();assert.equal(await page.locator('.entry-row:visible').count(),1);
await page.getByRole('button',{name:'AI 研究',exact:false}).click();assert(await page.locator('.search-empty').isVisible());
await page.getByRole('button',{name:'全部'}).click();await page.getByRole('searchbox').fill('失忆');assert.equal(await page.locator('.entry-row:visible').count(),1);
await page.locator('.entry-row:visible').click();
const before=await page.locator('.prose').evaluate(e=>getComputedStyle(e).fontSize);await page.getByRole('button',{name:'放大阅读字号'}).click();assert.notEqual(await page.locator('.prose').evaluate(e=>getComputedStyle(e).fontSize),before);
await page.getByRole('button',{name:'切换夜间阅读'}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
await page.getByRole('button',{name:'切换日间阅读'}).click();
await page.goto(base+'/posts/literature/栗子');assert.equal(await page.locator('.prose h1').count(),0);assert(await page.locator('.prose br').count()>0);
await page.screenshot({path:'/tmp/maopao-reading.png',fullPage:true});
const settings=JSON.parse(await page.locator('#comment-settings').textContent());assert.equal(settings.path,'/posts/literature/%E6%A0%97%E5%AD%90','Same comment thread path as old site');
const backendRead=page.waitForResponse(r=>new URL(r.url()).pathname.includes('/classes/Comment'),{timeout:15000}).catch(()=>null);
await page.getByRole('button',{name:'查看评论 / 写评论'}).click();
await page.waitForSelector('#comment-thread textarea');
await page.locator('#comment-thread textarea').fill('Browser verification draft — not submitted.');
assert(await page.locator('#comment-thread .vsubmit').isVisible());
const commentResponse=await backendRead;
console.log('Comment backend read:',commentResponse?commentResponse.status():'No backend response within 15 seconds');
if(commentResponse){const data=await commentResponse.json().catch(()=>({}));console.log('Comment backend result:',Array.isArray(data.results)?'Connected':data.error||data.code||'Response received');}
await page.screenshot({path:'/tmp/maopao-comments.png',fullPage:true});
await page.goto(base+'/subscribe');await page.getByRole('button',{name:'复制地址'}).click();assert(await page.locator('.copy-status').innerText());
for(const feed of ['/atom.xml','/feeds/fiction.xml','/feeds/poetry.xml','/feeds/research.xml']){const r=await page.request.get(base+feed);assert(r.ok());assert((await r.text()).includes('<feed xmlns="http://www.w3.org/2005/Atom">'));}
await page.goto(base+'/research');assert(await page.getByText('暂无文章。',{exact:true}).count());
await page.goto(base+'/not-a-page');assert(await page.getByRole('heading',{name:'页面不存在'}).count());
assert.deepEqual(errors,[]);await browser.close();console.log('Browser verified: five widths across five pages; original intro; full-text search; filters; reader settings; comments compose UI; RSS feeds; 404. No comment submitted.');
