import fs from 'node:fs';
import matter from 'gray-matter';
const {valine:settings}=matter(`---\n${fs.readFileSync('_config.yml','utf8')}\n---`).data;
const server=process.env.COMMENT_SERVER||settings.serverURLs||`https://${settings.appId.slice(0,8).toLowerCase()}.lc-cn-n1-shared.com`;
try{
 const response=await fetch(`${server}/1.1/classes/Comment?limit=0`,{headers:{'X-LC-Id':settings.appId,'X-LC-Key':settings.appKey},signal:AbortSignal.timeout(12000)});
 const data=await response.json();
 console.log('Comment service:',new URL(server).hostname,'status',response.status);
 if(response.ok&&Array.isArray(data.results)){console.log('Authenticated comment read succeeded.');}
 else{console.log('Service error:',data.code,data.error);process.exitCode=1;}
}catch(error){console.log('Comment connection failed:',error.message);process.exitCode=1;}
