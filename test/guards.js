// Repo guards: no native alert(); no single-quoted attributes with interpolation; every tab documented; i18n keys exist.
const fs=require('fs'),path=require('path'),assert=require('assert');const D=path.join(__dirname,'../public/js');let bad=[];
for(const f of fs.readdirSync(D).filter(x=>x.endsWith('.js')&&x!='ui.js')){const s=fs.readFileSync(path.join(D,f),'utf8');
 if(/(?<![\w.])alert\(/.test(s))bad.push(f+': native alert( — use SFX.notice/SFX.toast');
 if(/=\\?'\$\{/.test(s.replace(/\\'/g,'')) && !/ui\.js|boot\.js/.test(f)){const m=s.match(/[\w-]+='\$\{/g);if(m)bad.push(f+': single-quoted attribute with interpolation '+m[0])}}
// i18n keys used via tr('…') exist
const en=JSON.parse(fs.readFileSync(path.join(__dirname,'../public/i18n/en.json'),'utf8'));
for(const f of fs.readdirSync(D).filter(x=>x!='ui.js')){const s=fs.readFileSync(path.join(D,f),'utf8');for(const m of s.matchAll(/\btr\('([\w.]+)'/g))if(!(m[1] in en))bad.push(f+': missing i18n key '+m[1])}
// every tab id is documented in the in-app docs registry or legacy docs text
const all=fs.readdirSync(D).map(f=>fs.readFileSync(path.join(D,f),'utf8')).join('\n');const tabs=[...all.matchAll(/TABS\.push\(\['(\w+)'/g)].map(m=>m[1]);const docs=[...all.matchAll(/\bD\('(\w+)','(\w+)'/g)].map(m=>m[2]);
const legacy=new Set(['ai','docs','places','arcs','life','worlds','craft','book','cal']);for(const t of tabs)if(!docs.includes(t)&&!legacy.has(t))bad.push('tab without docs: '+t);
if(bad.length){console.error(bad.join('\n'));process.exit(1)}console.log('guards ok')
