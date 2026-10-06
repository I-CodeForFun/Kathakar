// Content-addressed blob store (data/blobs/<sha256>); per-user namespaces in multi-user mode (data/blobs/u-<id>/<sha256>)
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(process.env.KATHAKAAR_DATA||path.join(__dirname,'..','data'),'blobs'),ok=h=>/^[0-9a-f]{64}$/.test(h),MAX=5e6;
function make(DIR){fs.mkdirSync(DIR,{recursive:true});const f=h=>path.join(DIR,h);return{ok,MAX,DIR,
 put(h,buf){if(!ok(h))return 'bad hash';if(buf.length>MAX)return 'too large';if(crypto.createHash('sha256').update(buf).digest('hex')!==h)return 'hash mismatch';
  if(!fs.existsSync(f(h))){const t=f(h)+'.tmp';fs.writeFileSync(t,buf);fs.renameSync(t,f(h))}return ''},
 get(h){try{return fs.readFileSync(f(h))}catch(e){return null}},has:h=>ok(h)&&fs.existsSync(f(h)),
 del(h){try{fs.unlinkSync(f(h))}catch(e){}},
 list(){const o={};for(const n of fs.readdirSync(DIR))if(ok(n))o[n]=fs.statSync(path.join(DIR,n)).size;return o}}}
module.exports=Object.assign(make(ROOT),{make,forUser:id=>make(path.join(ROOT,'u-'+String(id).replace(/[^\w-]/g,'_')))});
