from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1200,'height':1000})
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'Failed to load' not in m.text else None);pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:3111');pg.wait_for_timeout(1000)
    pg.evaluate("S.tab='ai';render()");pg.wait_for_timeout(1500)
    print('status text',pg.inner_text('#app').split('Quick setups')[0][-380:].replace('\n',' | '))
    pg.click('button[data-ai=prof][data-i="2"]');print('prof applied',pg.evaluate("AIF.judge.provider+' '+AIF.judge.model+' / '+AIF.embed.model"))
    pg.select_option('select[data-aic="judge.provider"]','anthropic');pg.wait_for_timeout(100)
    print('remote warning',pg.evaluate("document.body.innerText.includes('never the whole manuscript')"),'key field',pg.evaluate("!!document.querySelector('input[data-aic=\"judge.key\"][type=password]')"))
    pg.fill('input[data-aic="judge.key"]','sk-test-1234')
    pg.click('button[data-ai=save]');pg.wait_for_timeout(2500)
    print('saved',pg.inner_text('#app').split('Save & apply')[-1][:200].replace('\n',' | '))
    print('key not in page',pg.evaluate("!document.documentElement.innerHTML.includes('sk-test-1234')"))
    pg.screenshot(path='ai.png',full_page=True)
    b.close()
print('ERRORS',errs)
