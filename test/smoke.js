process.env.EMBED_BACKEND=process.env.EMBED_BACKEND||'hash';
const assert=require('assert'),{check}=require('../server/checker');
(async()=>{const world={rules:[{id:'r1',cat:'Physics',text:'No flying',ban:'flying, levitation'},{id:'r2',cat:'Law',text:'Nobody may carry weapons in the temple'}]};
 const r=(await check(world,[{id:'a',text:'The wizard was flying above the market. Bread sold well.'},{id:'b',text:'The farmer ploughed the field at dawn.'},{id:'c',text:'Armed guards carried weapons in the temple.'}])).results;
 assert(r.a.some(v=>v.rule=='r1'),'flight flagged');assert(!r.b.length,'clean text passes');assert(r.c.some(v=>v.rule=='r2'),'derived concept flagged');console.log('ok',JSON.stringify(r))})().catch(e=>{console.error(e);process.exit(1)});
(async()=>{const {check}=require('../server/checker');
 const world={rules:[{id:'g',cat:'Chemistry',text:'Gold reacts with water and explodes'}]};
 const r=(await check(world,[{id:'e',text:'Sona crosses the river at dawn.\nSona — made of gold.'},{id:'f',text:'Sona crosses the desert.\nSona — made of gold.'}])).results;
 assert(r.e.length==1&&/Rule applies/.test(r.e[0].reason),'gold+water flagged');assert(!r.f.length,'gold without water passes');console.log('sona ok')})().catch(e=>{console.error(e);process.exit(1)});
