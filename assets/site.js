const toggle = document.querySelector('.theme-toggle');
function themeLabel() { const dark = document.documentElement.dataset.theme === 'dark'; toggle?.setAttribute('aria-label', dark ? '切换日间阅读' : '切换夜间阅读'); toggle?.setAttribute('aria-pressed', String(dark)); }
themeLabel();
toggle?.addEventListener('click', () => { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; try {localStorage.setItem('maopao-theme', dark ? 'dark' : 'light');} catch {} themeLabel(); });
const search = document.querySelector('input[type="search"]');
const rows = [...document.querySelectorAll('.entry-row')];
let filter = 'all';
function applyFilter() {const query = (search?.value || '').trim().toLocaleLowerCase();let count=0;rows.forEach(row => {row.hidden = !(filter==='all'||row.dataset.kind===filter) || !row.dataset.search.toLocaleLowerCase().includes(query); if (!row.hidden) count++;}); const empty=document.querySelector('.search-empty');if(empty)empty.hidden=count>0;const result=document.querySelector('#result-count');if(result)result.textContent=`${count} 篇文章`;}
search?.addEventListener('input',applyFilter);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});applyFilter();}));
let size=20;try {size=Math.min(26,Math.max(16,Number(localStorage.getItem('maopao-font'))||20));} catch {}
const prose=document.querySelector('.prose');function setFont(){prose?.style.setProperty('--reading-size',`${size}px`);document.querySelector('[data-font="smaller"]')?.toggleAttribute('disabled',size<=16);document.querySelector('[data-font="larger"]')?.toggleAttribute('disabled',size>=26);}
setFont();document.querySelectorAll('[data-font]').forEach(b=>b.addEventListener('click',()=>{size=Math.min(26,Math.max(16,size+(b.dataset.font==='larger'?2:-2)));setFont();try {localStorage.setItem('maopao-font',size);}catch {}}));
const progress=document.querySelector('.reading-progress');if(progress){let queued=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scrollY/max)):1})`;queued=false;};addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();}
