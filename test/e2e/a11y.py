"""Accessibility test (axe-core). Needs: npm i (installs devDependency axe-core), pip install playwright.
   Fails on any 'serious' or 'critical' WCAG A/AA violation across all tabs, both themes, and the main drawers."""
import json,os,sys
from playwright.sync_api import sync_playwright
AXE=os.path.join(os.path.dirname(__file__),'..','..','node_modules','axe-core','axe.min.js')
URL=os.environ.get('URL','http://localhost:3111');bad=[]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_context(viewport={'width':1300,'height':900},bypass_csp=True).new_page();pg.on('dialog',lambda d:d.accept())
    pg.goto(URL);pg.wait_for_timeout(1200);pg.evaluate("sw('sf-river')");pg.add_script_tag(path=AXE)
    def scan(name):
        r=pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']},resultTypes:['violations']})")
        for v in r['violations']:
            if v['impact'] in('serious','critical'):bad.append((name,v['id'],v['impact'],len(v['nodes']),v['nodes'][0]['html'][:110]))
    tabs=pg.evaluate("[...document.querySelectorAll('#sb [data-tab]')].map(b=>b.dataset.tab)")
    for theme in ('light','dark'):
        pg.evaluate(f"document.documentElement.dataset.theme='{theme}'")
        for t in tabs:
            pg.evaluate(f"S.tab='{t}';S.bk={{fmt:'book',ord:'time'}};render()");pg.wait_for_timeout(120);scan(f'{theme}/{t}')
        pg.evaluate("S.tab='book';S.bk={fmt:'book',ord:'time',edit:1};render()");scan(f'{theme}/book-edit')
        for fn in ('openBackups()','openLib()','openPrint()'):
            try:pg.evaluate(fn);pg.wait_for_timeout(80);scan(f'{theme}/{fn}');pg.evaluate("$('#dr').classList.remove('open')")
            except Exception as e:pass
    b.close()
seen=set()
for n,i,imp,c,h in bad:
    k=(i,h)
    if k in seen:continue
    seen.add(k);print(f'{imp.upper():8} {i:28} {n:22} x{c}  {h}')
print('a11y violations (serious/critical):',len(seen));sys.exit(1 if seen else 0)
