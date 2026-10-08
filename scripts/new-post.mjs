import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import matter from 'gray-matter';
const {values}=parseArgs({options:{title:{type:'string'},kind:{type:'string'},tags:{type:'string'},date:{type:'string'},featured:{type:'boolean',default:false},draft:{type:'boolean',default:false},help:{type:'boolean',default:false}}});
const dirs={fiction:'_posts/literature/novel',poetry:'_posts/literature/poem',research:'_posts/research',history:'_posts/history'};
if(values.help||!values.title?.trim()||!dirs[values.kind]){console.log('npm run new -- --kind fiction|poetry|research|history --title "标题" [--tags "标签1,标签2"] [--featured] [--draft] [--date YYYY-MM-DD]');process.exit(values.help?0:1);}
const now=new Date();const localDate=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const date=values.date||localDate;
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Use a valid date in YYYY-MM-DD format.');
const title=values.title.trim();const slug=title.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-');
const file=path.join(dirs[values.kind],`${date}-${slug}.md`);
const data={title,date,kind:values.kind};if(values.tags)data.tags=values.tags.split(',').map(t=>t.trim()).filter(Boolean);if(values.featured)data.featured=true;if(values.draft)data.published=false;
fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,matter.stringify('\n',data),{flag:'wx'});console.log(`Created ${file}`);
