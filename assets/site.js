const toggle = document.querySelector('.theme-toggle');
function themeLabel() {const dark=document.documentElement.dataset.theme==='dark';toggle?.setAttribute('aria-label',dark?'切换日间阅读':'切换夜间阅读');toggle?.setAttribute('aria-pressed',String(dark));}
themeLabel();
toggle?.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('maopao-theme',dark?'dark':'light');}catch{}themeLabel();});

const search=document.querySelector('.search-label input');
const rows=[...document.querySelectorAll('.entry-row')];
const params=new URLSearchParams(location.search);
let filter='all',index=null,tag=params.get('tag')||'';
const tagSelect=document.querySelector('#tag-select');
if(tagSelect)tagSelect.value=tag;
function applyFilter(){
 const query=(search?.value||'').trim().toLocaleLowerCase();let count=0;
 rows.forEach(row=>{const item=index?.get(row.dataset.url);const haystack=item?`${item.title} ${item.text} ${item.tags.join(' ')}`:row.innerText;row.hidden=!(filter==='all'||row.dataset.kind===filter)||!haystack.toLocaleLowerCase().includes(query)||(tag&&!item?.tags.includes(tag));if(!row.hidden)count++;});
 const empty=document.querySelector('.search-empty');if(empty)empty.hidden=count>0;
 const result=document.querySelector('#result-count');if(result)result.textContent=`${count} 篇文章`;
 const url=new URL(location.href);const q=(search?.value||'').trim();q?url.searchParams.set('q',q):url.searchParams.delete('q');tag?url.searchParams.set('tag',tag):url.searchParams.delete('tag');history.replaceState(null,'',url);
}
if(search){
 search.value=params.get('q')||'';
 search.addEventListener('input',applyFilter);
 if(location.hash==='#search')search.focus();
 fetch('/search-index.json').then(r=>{if(!r.ok)throw new Error('Search unavailable');return r.json();}).then(items=>{index=new Map(items.map(p=>[p.url,p]));applyFilter();}).catch(()=>{const error=document.querySelector('.search-error');if(error)error.hidden=false;applyFilter();});
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});applyFilter();}));
 tagSelect?.addEventListener('change',()=>{tag=tagSelect.value;applyFilter();});
}

let size=22.5;try{size=Math.min(26,Math.max(16,Number(localStorage.getItem('maopao-font-legacy'))||22.5));}catch{}
const prose=document.querySelector('.prose');
function setFont(){prose?.style.setProperty('--reading-size',`${size}px`);document.querySelector('[data-font="smaller"]')?.toggleAttribute('disabled',size<=16);document.querySelector('[data-font="larger"]')?.toggleAttribute('disabled',size>=26);}
setFont();document.querySelectorAll('[data-font]').forEach(b=>b.addEventListener('click',()=>{size=Math.min(26,Math.max(16,size+(b.dataset.font==='larger'?2:-2)));setFont();try{localStorage.setItem('maopao-font-legacy',size);}catch{}}));
const progress=document.querySelector('.reading-progress');if(progress){let queued=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scrollY/max)):1})`;queued=false;};addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();}

const copy=document.querySelector('[data-copy-feed]');copy?.addEventListener('click',async()=>{const input=document.querySelector('#feed-url');const status=document.querySelector('.copy-status');try{await navigator.clipboard.writeText(input.value);status.textContent='已复制订阅地址。';}catch{input.focus();input.select();status.textContent='请复制已选中的订阅地址。';}});

const loadComments=document.querySelector('.load-comments');
let loading=false;
async function showComments(){
 if(loading||!loadComments)return;loading=true;loadComments.disabled=true;
 const status=document.querySelector('.comment-status');status.textContent='正在加载评论…';
 try{
  const settings=JSON.parse(document.querySelector('#comment-settings').textContent);
  if(!window.AV)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/assets/leancloud.min.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
  if(!window.AV.applicationId)window.AV.init({appId:settings.appId,appKey:settings.appKey,...(settings.serverURLs?{serverURLs:settings.serverURLs}:{})});
  if(!window.Valine)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/assets/valine.min.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
  new window.Valine({...settings,el:'#comment-thread'});
  const container=document.querySelector('#comment-thread');
  container.querySelectorAll('input').forEach(input=>{const name=input.getAttribute('name');input.setAttribute('aria-label',name==='nick'?'昵称':name==='mail'?'邮箱（可选）':name==='link'?'网站（可选）':input.placeholder||'评论信息');});
  container.querySelector('textarea')?.setAttribute('aria-label','评论内容');
  const submit=container.querySelector('.vsubmit');if(submit)submit.textContent='发表评论';
  loadComments.hidden=true;status.textContent='';
 }catch{loading=false;loadComments.disabled=false;status.textContent='评论加载失败，请重试。';}
}
loadComments?.addEventListener('click',showComments);
addEventListener('hashchange',()=>{if(location.hash==='#comments')showComments();});
if(location.hash==='#comments')showComments();

const menu=document.querySelector('.site-menu');
const menuToggle=document.querySelector('.menu-toggle');
const menuBackdrop=document.querySelector('.menu-backdrop');
function setMenu(open){
 menu.hidden=!open;menuBackdrop.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';
 if(open){menu.querySelector('.menu-close').focus();}else{menuToggle.focus();}
}
menuToggle?.addEventListener('click',()=>setMenu(menu.hidden));
menuBackdrop?.addEventListener('click',()=>setMenu(false));
menu?.querySelector('.menu-close')?.addEventListener('click',()=>setMenu(false));
menu?.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();setMenu(false);return;}
 if(event.key==='Tab'){
  const focusable=[...menu.querySelectorAll('a,button,input')].filter(e=>!e.disabled);
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
