# Example stories ship with props, rules, packs etc.; nav is grouped; token dialog is in-app (no native prompt).
import subprocess,sys,os,time,tempfile,socket
from playwright.sync_api import sync_playwright
s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
p=subprocess.Popen(['node','server/index.js'],env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','KATHAKAAR_DATA':tempfile.mkdtemp(),'EMBED_BACKEND':'hash','KATHAKAAR_TOKEN':'secret'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
  time.sleep(1.5)
  with sync_playwright() as pw:
    b=pw.chromium.launch();pg=b.new_page();errs=[];native=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:(native.append(d.type),d.dismiss()))
    pg.goto(f'http://127.0.0.1:{port}/');pg.wait_for_selector('#nav .si');pg.wait_for_selector('dialog[open]',timeout=8000)
    assert 'Access token' in pg.inner_text('dialog[open]');print('token dialog ok')
    pg.fill('dialog[open] input','secret');pg.click('dialog[open] button[value=ok]');pg.wait_for_timeout(1500)
    assert not native,native
    groups=pg.eval_on_selector_all('#nav .gl','e=>e.map(x=>x.textContent)');print('groups',groups)
    assert groups==['Plan','Write','People','World','Tools','Help'],groups
    for id in ['sf-river','sf-sunstone']:
      print(pg.evaluate("typeof SAMPLES+' '+(+(JSON.parse(localStorage.getItem('sf-river')||'{}').sv||0))"));pg.evaluate("id=>{sw(id)}",id);pg.wait_for_timeout(300)
      r=pg.evaluate("[S.props.length,S.worlds.length,S.packs.length,S.places.filter(p=>p.desc).length,S.ev.filter(e=>(e.props||[]).length).length,SCHEMA.validate(S).errors.length,SCHEMA.repair(JSON.parse(JSON.stringify(S)))]")
      print(id,r);assert r[0]>=4 and r[1]==1 and r[3]>=5 and r[5]==0 and r[6]==0,r
      for t in ['props','worlds','places','packs','wiki','cork','arcs']:
        pg.click(f'[data-tab={t}]');pg.wait_for_timeout(150)
    pg.click('[data-tab=docs]');pg.wait_for_selector('#docq');n=pg.locator('#app .dc').count();assert n>=18,n
    pg.fill('#docq','custody');vis=pg.locator('#app .dc:visible').count();assert 0<vis<n,(vis,n);print('docs ok',n,vis)
    print('errors',errs);b.close();sys.exit(1 if errs else 0)
finally:p.terminate()
