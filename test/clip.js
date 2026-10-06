const assert=require('assert'),http=require('http'),C=require('../server/clip');
(async()=>{
 for(const ip of ['127.0.0.1','10.1.2.3','172.16.0.1','172.31.255.255','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','::','fc00::1','fd12::1','fe80::1','::ffff:127.0.0.1','::ffff:7f00:1','::ffff:a00:1'])assert(C.blockedIp(ip),ip);
 for(const ip of ['8.8.8.8','93.184.216.34','172.32.0.1','2606:4700::1111','1.1.1.1'])assert(!C.blockedIp(ip),ip);
 // URL encodings normalise to dotted decimal and are then blocked
 for(const u of ['http://127.0.0.1/','http://2130706433/','http://0x7f000001/','http://017700000001/','http://[::1]/','http://169.254.169.254/latest/meta-data/','http://0/','http://127.1/'])await assert.rejects(()=>C.clip(u),/blocked/,u);
 for(const u of ['http://localhost/','http://localhost./','http://foo.localhost/','http://metadata.google.internal/'])await assert.rejects(()=>C.clip(u),/blocked/,u);
 await assert.rejects(()=>C.clip('ftp://example.com/'),/http/);await assert.rejects(()=>C.clip('http://user:pw@example.com/'),/credentials/);await assert.rejects(()=>C.clip('http://example.com:8080/'),/port/);await assert.rejects(()=>C.clip('file:///etc/passwd'),/http/);
 // a live loopback server must be unreachable through the guard
 const srv=http.createServer((q,r)=>r.end('secret')).listen(0,'127.0.0.1');await new Promise(r=>srv.on('listening',r));
 process.env.KATHAKAAR_CLIP_ANYPORT='1';await assert.rejects(()=>C.clip('http://127.0.0.1:'+srv.address().port+'/'),/blocked/);srv.close();
 // text extraction strips scripts/markup
 assert.strictEqual(C.text('<p>Hi &amp; bye</p><script>alert(1)</script><style>x{}</style>'),'Hi & bye');
 console.log('clip ok')})().catch(e=>{console.error(e);process.exit(1)});
