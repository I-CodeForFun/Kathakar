// SSRF-safe page clipper (D3). Opt-in via KATHAKAAR_CLIP=1. Returns plain text only.
const dns=require('dns').promises,http=require('http'),https=require('https'),net=require('net'),os=require('os');
const v4=ip=>ip.split('.').map(Number);
function blockedV4(ip){const [a,b]=v4(ip);return a==0||a==10||a==127||(a==100&&b>=64&&b<=127)||(a==169&&b==254)||(a==172&&b>=16&&b<=31)||(a==192&&b==168)||(a==192&&b==0)||(a==198&&(b==18||b==19))||a>=224}
function blockedIp(ip){ip=String(ip).replace(/^\[|\]$/g,'').split('%')[0].toLowerCase();
 if(net.isIPv4(ip))return blockedV4(ip);
 if(net.isIPv6(ip)){if(ip=='::'||ip=='::1')return true;const m=/^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);if(m)return blockedV4(m[1]);const m2=/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(ip);if(m2){const h=parseInt(m2[1],16),l=parseInt(m2[2],16);return blockedV4([h>>8,h&255,l>>8,l&255].join('.'))}
  return /^f[cd]/.test(ip)||/^fe[89ab]/.test(ip)||/^ff/.test(ip)||ip.startsWith('64:ff9b:')||ip.startsWith('2001:db8')}
 return true}
const own=()=>new Set(Object.values(os.networkInterfaces()).flat().map(i=>i.address));
async function resolveSafe(host){host=String(host).replace(/^\[|\]$/g,'');if(net.isIP(host)){if(blockedIp(host))throw new Error('blocked address');return host}
 const h=host.replace(/\.$/,'').toLowerCase();if(h=='localhost'||h.endsWith('.localhost')||h.endsWith('.internal')||h.endsWith('.local'))throw new Error('blocked host');
 const addrs=await dns.lookup(h,{all:true});if(!addrs.length)throw new Error('no address');const mine=own();
 for(const a of addrs)if(blockedIp(a.address)||mine.has(a.address))throw new Error('blocked address');return addrs[0].address}
function checkUrl(u){let url;try{url=new URL(u)}catch(e){throw new Error('bad URL')}
 if(!/^https?:$/.test(url.protocol))throw new Error('only http(s)');if(url.username||url.password)throw new Error('credentials not allowed');
 const port=url.port||(url.protocol=='https:'?'443':'80');if(!(process.env.KATHAKAAR_CLIP_ANYPORT=='1')&&port!='80'&&port!='443')throw new Error('port not allowed');return url}
function fetchOnce(url,ip,deadline){return new Promise((ok,no)=>{const lib=url.protocol=='https:'?https:http,left=deadline-Date.now();if(left<=0)return no(new Error('timeout'));
 const req=lib.request({host:ip,family:net.isIPv6(ip)?6:4,port:url.port||(url.protocol=='https:'?443:80),path:url.pathname+url.search,method:'GET',servername:url.hostname,headers:{host:url.host,'user-agent':'Kathakaar-Clip/1.0','accept':'text/html,text/plain,application/xhtml+xml','accept-encoding':'identity'},timeout:left},res=>{
  if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();return ok({redirect:new URL(res.headers.location,url).toString()})}
  const ct=String(res.headers['content-type']||'').toLowerCase();if(!/^(text\/html|text\/plain|application\/xhtml\+xml)/.test(ct)){res.resume();return no(new Error('unsupported content type'))}
  if(res.statusCode>=400){res.resume();return no(new Error('HTTP '+res.statusCode))}
  const ch=[];let n=0;res.on('data',c=>{n+=c.length;if(n>2e6){req.destroy();no(new Error('too large'))}else ch.push(c)});res.on('end',()=>ok({body:Buffer.concat(ch).toString('utf8'),ct}));res.on('error',no)});
 req.on('timeout',()=>{req.destroy();no(new Error('timeout'))});req.on('error',no);req.end()})}
const ent={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
const text=h=>h.replace(/<(script|style|iframe|noscript|svg|template)\b[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<\/(p|div|h\d|li|tr|br|section|article)>|<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&(#x?[0-9a-f]+|\w+);/gi,(m,e)=>e[0]=='#'?String.fromCodePoint(Math.min(0x10ffff,e[1].toLowerCase()=='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10))||32):(ent[e.toLowerCase()]||' ')).replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n\n').trim();
async function clip(u){const deadline=Date.now()+5000;let url=checkUrl(u);
 for(let hop=0;hop<=3;hop++){const ip=await resolveSafe(url.hostname),r=await fetchOnce(url,ip,deadline);   // connect to the resolved IP: no DNS rebinding
  if(r.redirect){url=checkUrl(r.redirect);continue}
  const html=r.ct.includes('plain')?r.body:r.body,meta=n=>{const m=new RegExp('<meta[^>]+(?:name|property)=["\']'+n+'["\'][^>]*content=["\']([^"\']*)','i').exec(html);return m?text(m[1]):''};
  const title=(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)||[])[1];
  return{url:url.toString(),title:title?text(title).slice(0,300):'',author:meta('author'),date:meta('article:published_time')||meta('date'),text:text(html).slice(0,200000)}}
 throw new Error('too many redirects')}
module.exports={blockedIp,checkUrl,resolveSafe,clip,text};
