import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const base=path.resolve('_site');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml','.json':'application/json','.woff2':'font/woff2'};
http.createServer((req,res)=>{let file;try {file=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){file=path.join(base,'404.html');res.statusCode=404;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`Journal preview: http://127.0.0.1:${Number(process.env.PORT)||4173}`));
