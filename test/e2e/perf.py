# Perf budget on a synthetic 500-event story + mobile viewport smoke.
import subprocess,sys,os,time,tempfile,socket,json
from playwright.sync_api import sync_playwright
s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
p=subprocess.Popen(['node','server/index.js'],env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','KATHAKAAR_DATA':tempfile.mkdtemp(),'EMBED_BACKEND':'hash','KATHAKAAR_TOKEN':'t'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
  time.sleep(1.5);bad=[]
  with sync_playwright() as pw:
    b=pw.chromium.launch()
    for name,vp in [('desktop',{'width':1300,'height':900}),('mobile',{'width':390,'height':844})]:
      pg=b.new_context(viewport=vp,has_touch=name=='mobile').new_page();pg.add_init_script("localStorage.setItem('xl-token','t')");errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
      pg.goto(f'http://127.0.0.1:{port}/');pg.wait_for_selector('#wl8');pg.wait_for_timeout(2500);pg.wait_for_load_state('load');pg.wait_for_selector('#wl8')   # let the first sync settle (it may reload once to adopt server data)
      pg.evaluate("""()=>{const w='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor '.repeat(8);S.chars=Array.from({length:40},(_,i)=>({id:'c'+i,name:'Char'+i,color:'#888',role:''}));S.places=Array.from({length:20},(_,i)=>({id:'p'+i,name:'Place'+i}));
        S.ev=Array.from({length:500},(_,i)=>({id:'e'+i,tl:S.tls[0].id,t:i,title:'Chapter '+i,place:'p'+(i%20),chars:['c'+(i%40)],mood:'',notes:'note '+i,fin:{book:(w+'\\n').repeat(8)}}));save();render()}""")
      res={}
      for tab in ['matrix','cork','props','craft','packs','data']:
        t=pg.evaluate("t=>{const a=performance.now();S.tab=t;render();return performance.now()-a}",tab);res[tab]=round(t)
        if t>400:bad.append(f'{name} {tab} {t:.0f}ms')
      ix=pg.evaluate("(async()=>{const a=performance.now();const n=await SFX.work('index',{S});return [n,Math.round(performance.now()-a)]})()")
      lt=pg.evaluate("(async()=>{const t='The quick brown fox was seen by the lazy dog. '.repeat(10000);const a=performance.now();await SFX.work('lint',{text:t,opt:{}});return Math.round(performance.now()-a)})()")
      print(name,'render ms',res,'index',ix,'lint 100k words ms',lt)
      if ix[1]>800:bad.append(name+' index slow')
      if lt>1500:bad.append(name+' lint slow')
      # input latency: type into a textarea while a lint pass runs elsewhere
      if name=='desktop':
        pg.evaluate("S.tab='book';S.bk=S.bk||{};S.bk.edit=true;render()")
      ov=pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1")
      if name=='mobile' and ov:bad.append('mobile horizontal overflow')
      print(name,'errors',errs);bad+=errs
    b.close()
  print('PERF',('FAIL '+str(bad)) if bad else 'ok');sys.exit(1 if bad else 0)
finally:p.terminate()
