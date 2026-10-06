import base64,io,zipfile,json,xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
errs=[];PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
def ok(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: errs.append('FAIL '+m)
B64="""async f=>{const b=eval(f);const r=await new Promise(o=>{const x=new FileReader();x.onload=()=>o(x.result);x.readAsDataURL(b instanceof Blob?b:new Blob([b]))});return r.split(',')[1]}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900})
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)));pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'Failed to load' not in m.text else None);pg.on('dialog',lambda d:d.accept())
    pg.goto('http://localhost:3111');pg.wait_for_timeout(1200)
    pg.evaluate("sw('sf-river')");pg.wait_for_timeout(300)
    names=pg.evaluate("[...document.querySelectorAll('#sb [data-tab]')].map(b=>b.dataset.tab)")
    ok(all(t in names for t in ['cal','tension','weave','arcs','ai']),'new tabs present: '+','.join(names))
    # ---- calendar
    pg.evaluate("S.tab='cal';render()");pg.select_option('select[data-v6c=preset]','Fantasy (10 months × 36 days)');pg.wait_for_timeout(150)
    ok(pg.evaluate("cal().M==10&&cal().dpy==360&&U==cal().U"),'custom calendar applied (10 months)')
    ok(pg.evaluate("fullT(0.55).includes('Age')&&parts(0.999).m==10"),'dates named with era/months: '+pg.evaluate("fullT(0.55)"))
    pg.evaluate("S.cal.months[0].d=40;S.cal.months[1].d=20;render()");ok(pg.evaluate("(()=>{const t=timeOf(3,2,5,7,9),p=parts(t);return p.y==3&&p.m==2&&p.d==5&&p.h==7&&p.mi==9})()"),'timeOf/parts round-trip with uneven months')
    ok(pg.evaluate("STEPS.every(isFinite)&&STEPS.includes(1/cal().M)"),'STEPS rebuilt for calendar')
    pg.evaluate("S.cal.hol=[{n:'Harvest Festival',m:7,d:18}];S.tab='map';render()");ok(pg.evaluate("fullT(timeOf(2,7,18,0,0)).includes('Harvest Festival')"),'holiday shown')
    pg.evaluate("delete S.cal;S.tab='map';render()");ok(pg.evaluate("cal().M==12&&U==518400"),'reset to default')
    # ---- multi place
    pg.evaluate("S.places=[{id:'pa',name:'Vijaya Palace',lv:0,parent:null},{id:'pb',name:'The Great Chasm',lv:0,parent:null}];S.ev[0].place='Vijaya Palace';S.ev[0].px='The Great Chasm'")
    ok(pg.evaluate("plAll(S.ev[0]).length==2&&plEvents(S.places[1],false).some(e=>e.id==S.ev[0].id)"),'event listed under both places')
    pg.evaluate("openEv(S.ev[0].id)");ok(pg.evaluate("!!document.querySelector('#dr input[data-ev=px]')"),'Also-at field in event drawer');pg.evaluate("$('#dr').classList.remove('open')")
    # ---- tension + weave
    pg.evaluate("S.tab='tension';render()");ok(pg.evaluate("document.querySelectorAll('#app svg').length==2"),'tension + emotion charts render')
    pg.click('button[data-v6=tmood]');ok(pg.evaluate("S.ev.filter(e=>e.tn!==undefined).length>=8"),'estimate from moods')
    pg.select_option('select[data-v6t=curve]','Three-act structure');ok(pg.evaluate("document.querySelector('#app svg path[style*=dasharray]')!==null&&S.tnc=='Three-act structure'"),'intended curve drawn')
    pg.evaluate("S.ev.forEach(e=>e.tn=5);render()");ok('flat' in {'flat':1} and 'saggy' in pg.inner_text('#app'),'flat-tension note')
    pg.evaluate("S.tab='weave';render()");ok(pg.evaluate("document.querySelectorAll('#app svg circle').length>10"),'weave dots')
    pg.select_option('select[data-v6w=by]','tl');ok(pg.evaluate("S.wv.by=='tl'"),'weave by timeline')
    # ---- metadata + exports
    pg.evaluate("S.meta={author:'A. Writer',lang:'en-GB',series:'River Saga',seriesNo:'2',publisher:'Pub & Co',rights:'© 2026',isbn:'978-3-16-148410-0',desc:'A <tale> of rivers',cover:'%s'};S.bk={fmt:'book',ord:'time'};S.tab='book';render()"%PNG)
    ok(pg.evaluate("!!document.querySelector('#app [data-v7=expdlg]')"),'export hub button on Book tab')
    pg.click('#app [data-v7=expdlg]');ok(pg.evaluate("document.querySelectorAll('#dr [data-v7]').length>=8"),'export drawer lists formats')
    # DOCX
    z=zipfile.ZipFile(io.BytesIO(base64.b64decode(pg.evaluate(B64,"zip(docxFiles())"))))
    n=z.namelist();ok(z.testzip() is None,'docx zip CRCs valid')
    for need in ['[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml','word/footer1.xml','docProps/core.xml','word/media/cover.png','word/_rels/document.xml.rels']:ok(need in n,'docx has '+need)
    for f in n:
        if f.endswith('.xml') or f.endswith('.rels'):ET.fromstring(z.read(f))
    ok(True,'docx all XML well-formed')
    core=z.read('docProps/core.xml').decode();ok('A. Writer' in core and 'en-GB' in core and '&lt;tale&gt;' in core,'docx core properties (author, language, escaped blurb)')
    doc=z.read('word/document.xml').decode();ok('Heading1' in doc and 'rIdCover' in doc and 'Rain Returns' in doc,'docx headings, cover, chapters')
    # EPUB
    ez=zipfile.ZipFile(io.BytesIO(base64.b64decode(pg.evaluate(B64,"zip(epubFiles())"))))
    il=ez.infolist();ok(il[0].filename=='mimetype' and il[0].compress_type==0 and ez.read('mimetype')==b'application/epub+zip','epub: mimetype first and stored')
    for f in ez.namelist():
        if f.endswith(('.xml','.xhtml','.opf','.ncx')):ET.fromstring(ez.read(f))
    ok(True,'epub all XML/XHTML well-formed')
    ns={'o':'http://www.idpf.org/2007/opf','dc':'http://purl.org/dc/elements/1.1/'}
    cont=ET.fromstring(ez.read('META-INF/container.xml'));opf=cont.find('.//{*}rootfile').get('full-path');root=ET.fromstring(ez.read(opf))
    ok(root.find('.//dc:creator',ns).text=='A. Writer' and root.find('.//dc:language',ns).text=='en-GB' and root.find('.//dc:publisher',ns).text=='Pub & Co','epub dc metadata')
    mf={i.get('id'):i.get('href') for i in root.findall('.//o:item',ns)}
    ok(all(('OEBPS/'+h) in ez.namelist() for h in mf.values()),'epub manifest files all exist')
    ok(all(r.get('idref') in mf for r in root.findall('.//o:itemref',ns)),'epub spine ids in manifest')
    ok('belongs-to-collection' in ez.read(opf).decode() and 'cover-image' in ez.read(opf).decode(),'epub series + cover')
    ok(b'urn:isbn:9783161484100' in ez.read(opf),'epub isbn identifier')
    # script format + FDX + Fountain + Scrivener
    pg.evaluate("S.ev[1].prose='# INT. PALACE HALL - NIGHT\\nArjun (softly): Stay close.\\nPrincess Anya: I will.\\n> CUT TO:\\nThe door opens.';S.bk.fmt='script';render()")
    fdx=base64.b64decode(pg.evaluate(B64,"V7.fdxText()")).decode();r=ET.fromstring(fdx);types=[p.get('Type') for p in r.find('Content')]
    ok(all(t in types for t in ['Scene Heading','Action','Character','Parenthetical','Dialogue','Transition']),'fdx element types: '+','.join(sorted(set(types))))
    ok(any('(softly)' in (p.findtext('Text') or '') for p in r.find('Content')),'fdx parenthetical kept')
    sz=zipfile.ZipFile(io.BytesIO(base64.b64decode(pg.evaluate(B64,"zip(V7.scrivenerFiles())"))));sn=sz.namelist()
    ok(any(x.startswith('Manuscript/01 - ') and x.endswith('.rtf') for x in sn) and 'Notes/Characters.md' in sn and any(x.endswith('.fdx') for x in sn),'scrivener zip layout')
    ok(sz.read([x for x in sn if x.endswith('.rtf')][0]).startswith(b'{\\rtf1'),'rtf header')
    DX=pg.evaluate(B64,"zip(docxFiles())");SX=pg.evaluate(B64,"zip(V7.scrivenerFiles())")
    # print html
    ph=pg.evaluate("V7.printHtml({trim:'A5 (148 × 210 mm)',font:'serif',size:11,lh:1.5,margin:20,title:1,toc:1,nums:1,head:1,indent:1})");ok('@page' in ph and 'size:8.5in 11in' in ph,'print css: screenplay uses US Letter')
    pg.evaluate("S.bk.fmt='book'");ph=pg.evaluate("V7.printHtml({trim:'A5 (148 × 210 mm)',font:'serif',size:11,lh:1.5,margin:20,title:1,toc:1,nums:1,head:1,indent:1})");ok('size:148mm 210mm' in ph and 'counter(page)' in ph and 'target-counter' in ph and '<img src="data:image/png' in ph,'print css: A5, page numbers, toc, cover')
    # ---- round trips (script)
    story=pg.evaluate("JSON.stringify({chars:S.chars.length,title:S.title})")
    def imp(name,content,mime='text/plain',b64=False):
        js="""async([n,c,b])=>{const bytes=b?Uint8Array.from(atob(c),x=>x.charCodeAt(0)):c;const f=new File([bytes],n,{type:'%s'});const r=await V7.importManuscript(f);return JSON.stringify({r,ev:S.ev.map(e=>({t:e.title,p:e.prose,pl:e.place,c:e.chars.length})),chars:S.chars.map(c=>c.name)})}"""%mime
        return json.loads(pg.evaluate(js,[name,content,b64]))
    r=imp('scene.fdx',fdx,'application/xml')
    ok(r['r']['chapters']>=1 and any('Arjun (softly): Stay close.' in e['p'] for e in r['ev']),'FDX import keeps parenthetical in plan syntax')
    ok(any('# INT. PALACE HALL - NIGHT' in e['p'] for e in r['ev']) and any('> CUT TO:' in e['p'] for e in r['ev']),'FDX import keeps heading + transition (lossless)')
    ok('Arjun' in r['chars'] and 'Princess Anya' in r['chars'],'characters created from cues')
    # fountain via same blocks: export back from imported story and compare scene text
    again=pg.evaluate("(()=>{S.bk={fmt:'script'};const e=S.ev.find(e=>e.prose.includes('Stay close'));return scriptTxtOf(e)})()")
    ok('ARJUN' in again and '(softly)' in again and 'CUT TO:' in again and 'INT. PALACE HALL - NIGHT' in again,'script → plan → script round trip preserves structure')
    r=imp('book.md','# One\n\nHello there.\nSecond line.\n\n# Two\n\nBye.')
    ok(r['r']['chapters']==2 and r['ev'][0]['p']=='Hello there. Second line.','markdown import')
    # RTF
    rtf=r'{\rtf1\ansi{\fonttbl{\f0 Georgia;}}\f0 Chapter One\par\par It was \u8220?dark\u8221?.\par}'
    r=imp('x.rtf',rtf);ok(r['r']['chapters']==1 and '“dark”' in r['ev'][0]['p'],'rtf import (unicode)')
    # our docx + scrivener zip + .scriv-style zip
    r=imp('b.docx',DX,'application/zip',True);ok(r['r']['chapters']>=8,'docx import: %d chapters'%r['r']['chapters'])
    r=imp('s.zip',SX,'application/zip',True);ok(r['r']['chapters']>=8,'scrivener-ready zip import: %d chapters'%r['r']['chapters'])
    # real-ish .scriv bundle
    scriv=pg.evaluate("""()=>{const x='<?xml version="1.0"?><ScrivenerProject><Binder><BinderItem UUID="D1" Type="DraftFolder"><Title>Manuscript</Title><Children><BinderItem UUID="A1" Type="Text"><Title>Opening</Title></BinderItem><BinderItem UUID="A2" Type="Text"><Title>Storm</Title></BinderItem></Children></BinderItem><BinderItem UUID="R1" Type="ResearchFolder"><Title>Research</Title><Children><BinderItem UUID="N1" Type="Text"><Title>Note</Title></BinderItem></Children></BinderItem></Binder></ScrivenerProject>';
      const f=[['My.scriv/My.scrivx',x],['My.scriv/Files/Data/A1/content.rtf','{\\\\rtf1 First scene text.\\\\par More.}'],['My.scriv/Files/Data/A2/content.rtf','{\\\\rtf1 Rain fell.}'],['My.scriv/Files/Data/N1/content.rtf','{\\\\rtf1 SHOULD NOT IMPORT}']];return zip(f)}""")
    sb=pg.evaluate(B64,"(()=>{const x='<?xml version=\"1.0\"?><ScrivenerProject><Binder><BinderItem UUID=\"D1\" Type=\"DraftFolder\"><Title>Manuscript</Title><Children><BinderItem UUID=\"A1\" Type=\"Text\"><Title>Opening</Title></BinderItem><BinderItem UUID=\"A2\" Type=\"Text\"><Title>Storm</Title></BinderItem></Children></BinderItem><BinderItem UUID=\"R1\" Type=\"ResearchFolder\"><Title>Research</Title><Children><BinderItem UUID=\"N1\" Type=\"Text\"><Title>Note</Title></BinderItem></Children></BinderItem></Binder></ScrivenerProject>';return zip([['My.scriv/My.scrivx',x],['My.scriv/Files/Data/A1/content.rtf','{\\\\rtf1 First scene text.\\\\par More.}'],['My.scriv/Files/Data/A2/content.rtf','{\\\\rtf1 Rain fell.}'],['My.scriv/Files/Data/N1/content.rtf','{\\\\rtf1 SHOULD NOT IMPORT}']])})()")
    r=imp('My.scriv.zip',sb,'application/zip',True);ok(r['r']['chapters']==2 and [e['t'] for e in r['ev']]==['Opening','Storm'] and 'SHOULD NOT' not in json.dumps(r['ev']),'.scriv project import (draft only, binder order)')
    # bad inputs
    bad=pg.evaluate("""async()=>{const out=[];for(const [n,c] of [['x.fdx','<nope'],['x.zip','not a zip'],['x.txt','   ']]){try{await V7.importManuscript(new File([c],n));out.push('imported')}catch(e){out.push(e.message)}}return out}""")
    ok(all(x!='imported' for x in bad),'bad files rejected with message: %s'%bad)
    b.close()
print('ERRORS',[e for e in errs])
