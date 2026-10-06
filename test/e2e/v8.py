# v8 smoke: word chip, palette, craft tab, beats, inbox, no console errors, CSP intact
import subprocess,sys,os,time,tempfile,socket
from playwright.sync_api import sync_playwright
s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','KATHAKAAR_DATA':tempfile.mkdtemp(),'EMBED_BACKEND':'hash','KATHAKAAR_TOKEN':'testtok'}
p=subprocess.Popen(['node','server/index.js'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
  time.sleep(1.5);errs=[]
  with sync_playwright() as pw:
    b=pw.chromium.launch();pg=b.new_page();pg.add_init_script("localStorage.setItem('xl-token','testtok')");pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    t0=time.time();pg.goto(f'http://127.0.0.1:{port}/');pg.wait_for_selector('#wl8',timeout=8000);print('first paint+chip',round(time.time()-t0,2),'s')
    assert 'today' in pg.inner_text('#wl8')
    pg.keyboard.press('Control+k');pg.wait_for_selector('#pl-q');pg.keyboard.type('craft');pg.keyboard.press('Enter');pg.wait_for_selector('text=Style lint');print('palette -> craft ok')
    pg.click('[data-k=beats]');pg.click('[data-x8=bcreate]');pg.wait_for_selector('text=Ordinary World');n=pg.evaluate('S.ev.filter(e=>e.beat).length');assert n==12,n;print('beats created',n)
    pg.click('[data-x8=bmap]') if pg.is_enabled('[data-x8=bmap]') else None
    pg.click('[data-k=lint]');pg.click('[data-k=read]');pg.wait_for_selector('text=Flesch')
    pg.keyboard.press('Control+Shift+I');pg.wait_for_selector('#ib-t');pg.fill('#ib-t','Idea: the river lies');pg.click('[data-i=add]');pg.click('[data-i=p][data-k=place]');pg.wait_for_timeout(200)
    assert pg.evaluate("S.places.some(p=>p.name.startsWith('Idea'))");print('inbox promote ok')
    pg.keyboard.press('Escape')
    # packs + problems (v9)
    pg.evaluate("S.tab='packs';render()");pg.check('[data-p9=toggle][data-id=mystery]');pg.wait_for_selector('text=Clues')
    pg.click('[data-p9=add][data-c=clues]');pg.wait_for_selector('[data-l9=clues]')
    pg.evaluate("S.ev.push({id:'ea',tl:S.tls[0].id,t:1,title:'Early',chars:[],notes:''},{id:'eb',tl:S.tls[0].id,t:50,title:'Late',chars:[],notes:''});S.clues[0].text='Knife';S.clues[0].plantedIn='eb';S.clues[0].payoffIn='ea';save();render()")
    pg.keyboard.press('Control+Shift+M');pg.wait_for_selector('dialog[open] >> text=planted after its payoff');print('problems panel ok');pg.keyboard.press('Escape')
    pg.evaluate("S.packs.push('romance');save()");pg.evaluate("openEv('ea')");pg.wait_for_selector('#d9 details');assert pg.evaluate("document.querySelectorAll('#d9 details').length")>=2;print('drawer sections ok');pg.evaluate("document.querySelector('#dr').classList.remove('open')")
    pg.evaluate("S.tab='craft';window.__craft.sec='tools';render()");pg.wait_for_selector('text=Name generator');pg.click('[data-c9=gen]');pg.wait_for_selector('[data-c9=pin]');print('tools ok')
    pg.evaluate("window.__craft.sec='diff';render()");pg.wait_for_selector('text=Source text');pg.evaluate("window.__craft.sec='rd';render()");pg.wait_for_selector('text=Writing sprint');pg.click('[data-r9=sprint][data-m="10"]');pg.wait_for_selector('#tm9');print('timer ok')
    # props
    pg.evaluate("S.chars.push({id:'ca',name:'Ana'},{id:'cb',name:'Ben'});S.places.push({id:'pa',name:'Inn'},{id:'pb',name:'Keep'});S.ev.forEach((e,i)=>{e.chars=[i%2?'cb':'ca'];e.place=i%2?'pb':'pa'});S.tab='props';save();render()")
    pg.click('[data-pr9=add]');pg.wait_for_selector('[data-pr9=f][data-k=name]');pg.fill('[data-pr9=f][data-k=name]','Sword');pg.press('[data-pr9=f][data-k=name]','Tab')
    pg.select_option('[data-pr9=f][data-k=owner]','ca');pg.click('[data-pr9=ladd]');pg.wait_for_selector('[data-pr9=l][data-k=holder]')
    pg.select_option('[data-pr9=l][data-k=state]','destroyed');pg.wait_for_timeout(200)
    assert pg.evaluate("S.props[0].log[0].state")=='destroyed' and pg.evaluate("S.props[0].owner")=='ca'
    pg.click('[data-pr9=mode][data-k=matrix]');pg.wait_for_selector('text=Sword');pg.click('[data-pr9=mode][data-k=char]');pg.wait_for_selector('th:has-text("Ana")');print('props ui ok')
    pg.evaluate("const l=S.props[0].log[0];const idx=S.ev.findIndex(e=>e.id==l.ev);S.ev[Math.min(S.ev.length-1,idx+1)].props=['"+"'+S.props[0].id+'"+"'];save()") if False else None
    pg.evaluate("const id=S.props[0].id,l=S.props[0].log[0];const o=[...S.ev].sort((a,b)=>a.t-b.t);const k=o.findIndex(e=>e.id==l.ev);const nxt=o[k+1];if(nxt){nxt.props=[id]};save();render()")
    pg.keyboard.press('Control+Shift+M');pg.wait_for_selector('dialog[open] >> text=destroyed earlier');print('prop problem ok');pg.keyboard.press('Escape')
    # corkboard keyboard reorder
    pg.evaluate("S.tab='cork';render()");pg.wait_for_selector('.cork9');first=pg.evaluate("bookEv()[0].id")
    pg.focus('.cork9');pg.keyboard.press('Space');pg.keyboard.press('ArrowRight');pg.wait_for_timeout(150);pg.keyboard.press('Space')
    assert pg.evaluate("bookEv()[1].id")==first and pg.evaluate("S.bk.ord")=='custom';print('corkboard keyboard reorder ok')
    pg.click('[data-k9=mode][data-m=kanban]');pg.wait_for_selector('[data-col]');print('kanban ok')
    # blob store + board + map + wiki + publish tab
    import zlib,struct,tempfile as tf
    def png(w,h,rgb):
        raw=b''.join(b'\x00'+bytes(rgb)*w for _ in range(h));ch=lambda t,d:struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
        return b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+ch(b'IDAT',zlib.compress(raw))+ch(b'IEND',b'')
    f=tf.NamedTemporaryFile(suffix='.png',delete=False);f.write(png(64,48,(200,30,30)));f.close()
    pg.evaluate("S.tab='board';render()");pg.wait_for_selector('[data-b12=add]')
    with pg.expect_file_chooser() as fc: pg.click('[data-b12=add]')
    fc.value.set_files(f.name);pg.wait_for_selector('input[aria-label="Alt text (required)"], dialog[open] input');pg.fill('dialog[open] input','A red square');pg.keyboard.press('Enter')
    pg.wait_for_selector('figure img[data-blob]');pg.wait_for_function("document.querySelector('figure img').src.startsWith('blob:')");
    assert pg.evaluate("S.board.length")==1 and pg.evaluate("JSON.stringify(S).length")<20000 and pg.evaluate("S.board[0].palette.length")>0;print('blob board ok')
    pg.wait_for_timeout(800);h=pg.evaluate("S.board[0].blob.b");import urllib.request as ur
    rq=ur.Request(f'http://127.0.0.1:{port}/api/blob/'+h,headers={'authorization':'Bearer testtok'});assert len(ur.urlopen(rq).read())>50;print('blob uploaded to server ok')
    pg.evaluate("S.tab='wmap';render()");pg.wait_for_selector('[data-b12=mapup]')
    with pg.expect_file_chooser() as fc: pg.click('[data-b12=mapup]')
    fc.value.set_files(f.name);pg.fill('dialog[open] input','Test map');pg.keyboard.press('Enter');pg.wait_for_selector('[data-b12=mode][data-m=pin]');pg.click('[data-b12=mode][data-m=pin]')
    pg.click('#wm12',position={'x':30,'y':20});pg.wait_for_selector('.pin12');pg.focus('.pin12');x0=pg.evaluate("S.worldmap.pins[0].x");pg.keyboard.press('ArrowRight');pg.wait_for_timeout(100);assert pg.evaluate("S.worldmap.pins[0].x")>x0;print('world map pin + keyboard nudge ok')
    pg.evaluate("S.ev[0].notes='See [[Ana]] and [[Nobody]].';S.tab='wiki';save();render()");pg.wait_for_selector('text=Link health');pg.keyboard.press('Control+Shift+M');pg.wait_for_selector('dialog[open] >> text=Broken link');print('wiki broken link problem ok');pg.keyboard.press('Escape')
    pg.evaluate("S.tab='craft';window.__craft.sec='pub';render()");pg.wait_for_selector('text=Query letter');pg.fill('[data-q12=hook]','A hook.');pg.press('[data-q12=hook]','Tab');pg.wait_for_selector('text=Beta readers');print('publish tab ok')
    pg.evaluate("S.packs=['fantasy'];S.moon={period:29.5,epoch:10};S.ev[0].t=10;S.ev[0].title='Night';S.ev[0].notes='A full moon rose.';S.ev[1].t=20;S.ev[1].notes='Another full moon.';save();render()")
    pg.keyboard.press('Control+Shift+M');pg.wait_for_selector('dialog[open] >> text=full moon');txt=pg.inner_text('dialog[open]');assert 'not full' in txt or 'apart' in txt;print('moon check ok');pg.keyboard.press('Escape')
    pg.evaluate("S.tab='data';render()");pg.wait_for_selector('text=Diagnostics');pg.wait_for_selector('text=browser usage');print('storage report ok')
    pg.evaluate("S.tab='docs';render()");pg.wait_for_selector('text=Corkboard');print('docs registry ok')
    # lint worker + panel
    pg.evaluate("S.tab='book';S.bk=S.bk||{};S.bk.edit=true;render()");
    pg.evaluate("S.ev[0].fin={book:'The door was opened by Sam. She felt happy. It was a dark and stormy night.'};save();render()")
    r=pg.evaluate("SFX.lintText('The door was opened by Sam. She felt happy.',{}).then(h=>h.map(x=>x.ruleId))");assert 'passive' in r and 'tell' in r,r;print('lint via worker ok',r)
    big=pg.evaluate("(async()=>{const t='The quick brown fox jumped over the lazy dog and it was seen by everyone. '.repeat(1300);const t0=performance.now();const h=await SFX.lintText(t,{});return [h.length,Math.round(performance.now()-t0)]})()");print('100k-word lint ms',big);assert big[1]<4000
    pg.evaluate("S.tab='craft';window.__craft.sec='print';render()");pg.wait_for_selector('text=Preflight');pg.check('[data-p15=on]');pg.fill('[data-p15=pages]','301');pg.press('[data-p15=pages]','Tab');pg.wait_for_selector('text=Page size with bleed')
    css=pg.evaluate("SFX.printExtra()");assert '@page:left' in css and 'break-before:right' in css and 'mm' in css;print('print profile css ok')
    pg.evaluate("window.__craft.sec='cover';render()");pg.wait_for_selector('#cv15');pg.wait_for_timeout(300);px=pg.evaluate("(()=>{const c=document.getElementById('cv15'),d=c.getContext('2d').getImageData(5,5,1,1).data;return Array.from(d)})()");assert px[3]==255 and px[2]>60,px;print('cover canvas drawn',px)
    with pg.expect_download() as dn: pg.click('[data-cvb=png]')
    assert dn.value.suggested_filename.endswith('.png');pg.click('[data-cvb=use]');assert pg.evaluate("S.meta.cover.startsWith('data:image/jpeg')");print('cover export + use ok')
    pg.evaluate("S.tab='craft';window.__craft.sec='serial';render()");pg.wait_for_selector('text=Release schedule');html=pg.inner_text('details');assert len(html)>0;print('serial ui ok')
    rep=pg.evaluate("(()=>{const f=SFX.epubFiles();return SFX.epubGate(f)?[true,SFX.lastEpubReport.errors,SFX.lastEpubReport.warnings]:[false,SFX.lastEpubReport.errors]})()");print('epub gate',rep);assert rep[0] is True,rep
    # zip-bomb + path traversal guards in the importer
    import zipfile,io
    def zbytes(entries):
        b=io.BytesIO()
        with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
            for n,d in entries:z.writestr(n,d)
        return list(b.getvalue())
    bomb=zbytes([('a.txt',b'\0'*(120*1024*1024))]);trav=zbytes([('../evil.txt',b'x')]);ok=zbytes([('ok.txt',b'hello')])
    r=pg.evaluate("async a=>{const o=[];for(const z of a){try{const m=await SFX.unzip(new Uint8Array(z).buffer);o.push('ok:'+m.size)}catch(e){o.push('err:'+e.message)}}return o}",[bomb,trav,ok]);print(r)
    assert r[0].startswith('err:') and ('too large' in r[0] or 'suspicious' in r[0]) and r[1].startswith('err:') and 'unsafe' in r[1] and r[2]=='ok:1';print('zip guards ok')
    pg.click('#wl8');pg.wait_for_selector('dialog[open] svg[role=img]');print('wordlog dialog ok');pg.keyboard.press('Escape')
    pg.wait_for_timeout(1500);st=pg.evaluate('SFSYNC.status');print('sync status',st);assert st=='online',st
    import urllib.request;r=urllib.request.Request(f'http://127.0.0.1:{port}/api/kv-meta',headers={'authorization':'Bearer testtok'});m=urllib.request.urlopen(r).read().decode();print('server keys',m[:80]);assert 'sf2' in m
    b.close()
  bad=[e for e in errs if 'favicon' not in e];print('errors',bad);sys.exit(1 if bad else 0)
finally: p.terminate()
