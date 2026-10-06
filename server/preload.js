// Download an embedding model into ./models ahead of time:  node server/preload.js [Xenova/bge-base-en-v1.5 ...]
// Used by the Docker build (PRELOAD_MODEL) and as `npm run preload-model`.
const path=require('path');
(async()=>{const ids=process.argv.slice(2).filter(Boolean);if(!ids.length)ids.push(process.env.AI_EMBED_MODEL||'Xenova/bge-base-en-v1.5');
 const {pipeline,env}=await import('@xenova/transformers');env.localModelPath=path.join(__dirname,'..','models');env.cacheDir=path.join(__dirname,'..','models','.cache');
 for(const id of ids){const t=Date.now();process.stdout.write('Downloading '+id+' … ');const p=await pipeline(id.includes('nli')?'zero-shot-classification':'feature-extraction',id,{quantized:true});if(p.dispose)await p.dispose();console.log('done in '+Math.round((Date.now()-t)/1000)+'s')}})().catch(e=>{console.error('preload failed:',e.message);process.exit(1)});
