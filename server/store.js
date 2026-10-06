require('./env');
// Tiny file-based key/value store: one JSON file per key in data/kv/
const fs=require('fs'),path=require('path');
const CR=require('./crypt'),KEY=CR.keyFrom(process.env),ROOT=path.join(process.env.KATHAKAAR_DATA||path.join(__dirname,'..','data'),'kv');
const rd=n=>CR.dec(fs.readFileSync(n),KEY).toString('utf8'),wr=(n,v)=>fs.writeFileSync(n,KEY?CR.enc(Buffer.from(v),KEY):v);
const ok=k=>/^[\w-]{1,64}$/.test(k);
function make(DIR){fs.mkdirSync(DIR,{recursive:true});const f=k=>path.join(DIR,k+'.json');
const etag=k=>{try{const st=fs.statSync(f(k));return '"'+Math.round(st.mtimeMs)+'-'+st.size+'"'}catch(e){return null}};
return{DIR,encrypted:!!KEY,ok,etag,get(k){try{return rd(f(k))}catch(e){if(e.code=='ENOENT')return null;throw e}},
 meta(){const o={};for(const n of fs.readdirSync(DIR))if(n.endsWith('.json')){const st=fs.statSync(path.join(DIR,n));o[n.slice(0,-5)]={m:Math.round(st.mtimeMs),n:st.size}}return o},
 all(){const o={};for(const n of fs.readdirSync(DIR))if(n.endsWith('.json'))o[n.slice(0,-5)]=rd(path.join(DIR,n));return o},
 set(k,v){const t=f(k)+'.tmp';wr(t,v);fs.renameSync(t,f(k))},
 del(k){try{fs.unlinkSync(f(k))}catch(e){}}}}
module.exports=Object.assign(make(ROOT),{make,ROOT,forUser:id=>make(path.join(ROOT,'u-'+String(id).replace(/[^\w-]/g,'_')))});
