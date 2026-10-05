// Copy only the built public files into the Pages publishing root.
// Source Markdown, templates, and repository history are never removed.
import fs from 'node:fs';
import path from 'node:path';
for(const entry of fs.readdirSync('_site')) {
  fs.cpSync(path.join('_site',entry),entry,{recursive:true});
}
console.log('Compiled site copied to the GitHub Pages root. Commit and push to publish.');
