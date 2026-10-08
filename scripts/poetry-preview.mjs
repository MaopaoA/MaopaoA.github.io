// Preserve complete stanzas. Only a one-line opening invites more stanzas.
export function poetryPreview(body) {
 const stanzas=body.replace(/\r\n/g,'\n').trim().split(/\n\s*\n/).filter(s=>s.trim()).map(s=>s.split('\n').map(line=>line.trimEnd()));
 if(!stanzas.length)return '';
 const first=stanzas[0];
 let selected=[first],count=first.length;
 if(count===1){
  for(const stanza of stanzas.slice(1)){
   if(count+stanza.length>6)break;
   selected.push(stanza);count+=stanza.length;
  }
 }
 if(count>6||count===1)selected=[stanzas.flat().slice(0,3)];
 return selected.map(stanza=>stanza.join('  \n')).join('\n\n')+'  \n…';
}
