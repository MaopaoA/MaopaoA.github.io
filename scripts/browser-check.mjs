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

async function verifyEditorialLayout(){
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/literature']){
   await page.goto(base+route,{waitUntil:'domcontentloaded'});
   const main=await page.locator('.content').boundingBox();
   const footer=await page.locator('.site-footer').boundingBox();
   assert(Math.abs(main.x-footer.x)<1&&Math.abs(main.width-footer.width)<1,`Footer aligns with content at ${width}: ${route}`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(route==='/literature')assert(parseFloat(await page.locator('.collection-head h1').evaluate(e=>getComputedStyle(e).fontSize))<=36);
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    const gradient=await page.locator('.site-footer').evaluate(e=>getComputedStyle(e).backgroundImage);
    assert(gradient.startsWith(`linear-gradient(rgb(${theme==='light'?'255, 255, 255':'34, 34, 34'}) 0%`),gradient);
    assert(gradient.endsWith(', 0) 100%)'),gradient);
   }
   await page.evaluate(()=>document.documentElement.dataset.theme='light');
  }
 }
 await page.keyboard.press('/');
 assert.equal(await page.locator('#home-query').evaluate(e=>e===document.activeElement),true);
 assert(await page.locator('.content').evaluate(e=>e.inert));
 await page.keyboard.press('Escape');
 assert(!(await page.locator('.content').evaluate(e=>e.inert)));
 await page.setViewportSize({width:1440,height:1050});
 console.log('Editorial checks passed: aligned footer, white-to-transparent and dark gradients, restrained titles, four widths, keyboard search and modal focus.');
}

if(process.argv.includes('--appearance-only')){
 await verifyEditorialLayout();
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.home-profile-avatar img')?.naturalWidth>0);
 assert.equal((await page.locator('.home-three-col').evaluate(e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length,3);
 await page.screenshot({path:'/tmp/maopao-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 const moon=await page.locator('.theme-toggle').boundingBox();const menu=await page.locator('.menu-toggle').boundingBox();
 assert(moon.x+moon.width<=menu.x,'Mobile controls do not overlap');
 await page.screenshot({path:'/tmp/maopao-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1050});
 await page.goto(base+'/literature',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.literature-layout').evaluate(e=>getComputedStyle(e).flexDirection),'row');
 await page.screenshot({path:'/tmp/maopao-literature.png',fullPage:true});
 await page.goto(base+'/posts/literature/失忆',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.prose').evaluate(e=>getComputedStyle(e).fontSize),'22.5px');
 assert.equal(await page.locator('.prose p').first().evaluate(e=>getComputedStyle(e).textIndent),'45px');
 await page.screenshot({path:'/tmp/maopao-article.png'});
 await page.locator('.reading-end').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.reading-progress')).transform==='matrix(1, 0, 0, 1, 0, 0)');
 assert(await page.locator('.comments-section').count(),'Progress completes before the comments');

 assert.deepEqual(errors,[]);await browser.close();console.log('Appearance verified: original three columns, literature columns, Times typography, paragraph indentation, separate mobile controls.');process.exit(0);
}
await page.goto(base+'/',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.querySelector('.home-profile-avatar img')?.complete&&document.querySelector('.home-profile-avatar img')?.naturalWidth>0);
assert((await page.locator('.profile-text').innerText()).trim()===fs.readFileSync('content/profile.md','utf8').trim(),'Original introduction preserved verbatim');
assert.equal(await page.locator('.home-card').count(),6);
assert((await page.locator('body').evaluate(e=>getComputedStyle(e).fontFamily)).includes('Times New Roman'));
assert((await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('png'));
assert.equal(await page.locator('.home-profile-avatar img').getAttribute('src'),'/image/avatar.png');
await page.screenshot({path:'/tmp/maopao-desktop.png',fullPage:true});
for(const width of [320,375,390,768,1440]){
 await page.setViewportSize({width,height:900});
 for(const route of ['/','/archive','/subscribe','/about','/posts/literature/栗子']){
  await page.goto(base+route);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow at ${width} on ${route}`);
 }
}
await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await page.screenshot({path:'/tmp/maopao-mobile.png',fullPage:true});
await page.getByRole('button',{name:'打开菜单'}).click();
assert(await page.locator('#site-menu').isVisible());
await page.keyboard.press('Escape');
assert(!(await page.locator('#site-menu').isVisible()));
assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
await page.getByRole('button',{name:'打开菜单'}).click();
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
