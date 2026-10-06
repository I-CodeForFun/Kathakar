import subprocess,time,json,urllib.request,os
from playwright.sync_api import sync_playwright
os.chdir('kathakaar')
def start():
    return subprocess.Popen(['node','server/index.js'],env={**os.environ,'PORT':'3112'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
srv=None;errs=[]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:3112') if False else None
    # server down at boot: serve static via a tiny second server? use route to fake: abort /api calls
    pg.route('**/api/**',lambda r:r.abort())
    srv=start();time.sleep(1.2)
    pg.goto('http://localhost:3112');pg.wait_for_timeout(1500)
    print('status at boot (api blocked)',pg.evaluate("SFSYNC.status"),'tabs',pg.evaluate("document.querySelectorAll('#sb [data-tab]').length"))
    pg.evaluate("localStorage.setItem('sf-late',JSON.stringify({title:'Written offline',chars:[],ev:[]}))");pg.wait_for_timeout(600)
    pg.unroute('**/api/**')
    ok=pg.evaluate("SFSYNC.retry()");pg.wait_for_timeout(1200)
    kv=json.loads(urllib.request.urlopen('http://localhost:3112/api/kv').read())
    print('retry ok',ok,'offline write reached server','sf-late' in kv,'status',pg.evaluate("SFSYNC.status"))
    b.close()
srv.terminate();import shutil;shutil.rmtree('data',ignore_errors=True)
print('ERRORS',errs)
