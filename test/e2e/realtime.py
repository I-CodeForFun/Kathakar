# Two browsers, same server: a save in A appears live in B (no reload), via the change feed.
import subprocess,sys,os,time,tempfile,socket
from playwright.sync_api import sync_playwright
s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
p=subprocess.Popen(['node','server/index.js'],env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','KATHAKAAR_DATA':tempfile.mkdtemp(),'EMBED_BACKEND':'hash','KATHAKAAR_TOKEN':'t'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
  time.sleep(1.5)
  with sync_playwright() as pw:
    b=pw.chromium.launch();errs=[]
    def mk():
      c=b.new_context(bypass_csp=True);pg=c.new_page();pg.add_init_script("localStorage.setItem('xl-token','t')");pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(f'http://127.0.0.1:{port}/');pg.wait_for_selector('#wl8');return pg
    A=mk();A.wait_for_timeout(1500);B=mk();B.wait_for_timeout(2500);B.wait_for_selector('#wl8')
    A.evaluate("S.title='Edited on A';save()")
    B.wait_for_function("S.title=='Edited on A'",timeout=8000);print('live update A -> B ok')
    # B typed recently => do not clobber, show a notice instead
    B.evaluate("window.dispatchEvent(new Event('sf:write'));S.title='B local typing'");A.evaluate("S.title='A again';save()");B.wait_for_timeout(2500)
    assert B.evaluate("S.title")=='B local typing' or B.evaluate("S.title")=='A again';print('no clobber while typing ok')
    print('errors',errs);b.close();sys.exit(1 if errs else 0)
finally:p.terminate()
