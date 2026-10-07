import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const cache=path.join(os.homedir(),'Library/Caches/ms-playwright');
const cached=fs.readdirSync(cache).filter(n=>n.startsWith('chromium-')).map(n=>path.join(cache,n,'chrome-mac/Chromium.app/Contents/MacOS/Chromium')).find(p=>fs.existsSync(p));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||cached});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.SITE_URL||'http://127.0.0.1:4179';
for(const width of [320,390,768,1024,1440]){
 await page.setViewportSize({width,height:900});
 await page.goto(base+'/literature',{waitUntil:'domcontentloaded'});
 if(width<1024){
  await page.locator('[data-literature-view=poems]').click();
  assert(await page.locator('#poems').isVisible());assert(!(await page.locator('#novels').isVisible()));
  const bounds=await page.locator('.poem-card').first().boundingBox();assert(bounds.y<450,'Poetry appears near the top');
  await page.reload({waitUntil:'domcontentloaded'});assert(await page.locator('#poems').isVisible());
  await page.locator('[data-literature-view=novels]').click();assert(await page.locator('#novels').isVisible());
 }else{assert(await page.locator('#novels').isVisible());assert(await page.locator('#poems').isVisible());}
 for(const route of ['/','/literature','/poetry','/archive','/subscribe','/about','/research','/posts/literature/失忆','/posts/literature/失恋']){
  await page.goto(base+route,{waitUntil:'domcontentloaded'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${route}`);
 }
 await page.goto(base+'/posts/literature/失忆',{waitUntil:'domcontentloaded'});
 const novelSize=await page.locator('.prose').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
 assert.equal(await page.locator('.prose p').first().evaluate(e=>getComputedStyle(e).textIndent),'0px');
 assert.equal(await page.locator('.prose p').nth(1).evaluate(e=>parseFloat(getComputedStyle(e).textIndent)),novelSize*2);
 await page.goto(base+'/posts/literature/失恋',{waitUntil:'domcontentloaded'});
 const poemSize=await page.locator('.prose').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert(poemSize>novelSize);
 assert.equal(await page.locator('.prose p').first().evaluate(e=>getComputedStyle(e).textIndent),'0px');
 assert.equal(await page.locator('.prose p').count(),4);assert.equal(await page.locator('.prose br').count(),15);
 assert((await page.locator('meta[property="og:image"]').getAttribute('content')).endsWith('/image/share.png'));
 assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'),'summary_large_image');
 if(width===390)await page.screenshot({path:'/tmp/maopao-poetry-mobile.png',fullPage:true});
}
await page.setViewportSize({width:390,height:900});await page.goto(base+'/literature#poems',{waitUntil:'domcontentloaded'});await page.screenshot({path:'/tmp/maopao-literature-mobile.png',fullPage:true});
await page.goto(base+'/posts/literature/失恋',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'放大阅读字号'}).click();
await page.goto(base+'/posts/literature/失忆',{waitUntil:'domcontentloaded'});
assert.equal(await page.locator('.prose').evaluate(e=>getComputedStyle(e).fontSize),'16.5px','Poetry preference does not change fiction');
await page.evaluate(()=>{navigator.share=async data=>{window.sharedArticle=data;};});await page.getByRole('button',{name:'分享',exact:true}).click();assert.equal(await page.evaluate(()=>window.sharedArticle.title),'失忆');
assert.deepEqual(errors,[]);await browser.close();console.log('Reading verified at five widths: nine pages, subject switching, direct poetry links, stanza preservation, independent fonts, two-character indents, share metadata and share action.');
