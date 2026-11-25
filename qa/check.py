from playwright.sync_api import sync_playwright
import json, re

URL='https://suwon-friends-1213-invite.vercel.app/'
report={}
with sync_playwright() as p:
    b=p.chromium.launch()
    # --- mobile
    ctx=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                      locale='ko-KR', timezone_id='Asia/Seoul', accept_downloads=True)
    page=ctx.new_page()
    errors=[]
    page.on('console', lambda m: errors.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
    page.on('pageerror', lambda e: errors.append('pageerror: '+str(e)))
    resp=page.goto(URL, wait_until='networkidle', timeout=60000)
    report['status']=resp.status
    page.wait_for_timeout(1200)
    report['dday']=page.inner_text('#dday')
    report['title']=page.title()
    # images loaded?
    imgs=page.evaluate("""() => Array.from(document.images).map(i=>({src:i.currentSrc.split('/').pop(), w:i.naturalWidth, h:i.naturalHeight, complete:i.complete}))""")
    report['images']=imgs
    # fonts
    report['fonts']=page.evaluate("() => ({pretendard: document.fonts.check('16px Pretendard'), gowun: document.fonts.check('16px \"Gowun Batang\"')})")
    # layout overflow
    report['scrollWidth']=page.evaluate("() => ({doc: document.documentElement.scrollWidth, vw: innerWidth})")
    page.screenshot(path='qa/mobile-top.png')
    page.screenshot(path='qa/mobile-full.png', full_page=True)
    # scroll through reveal sections
    h=page.evaluate("() => document.body.scrollHeight")
    for y in range(0,h,600):
        page.evaluate(f"window.scrollTo(0,{y})"); page.wait_for_timeout(120)
    page.evaluate("window.scrollTo(0,0)"); page.wait_for_timeout(300)
    page.screenshot(path='qa/mobile-full.png', full_page=True)
    # copy address button -> toast
    page.click('.venue__actions [data-copy]')
    page.wait_for_timeout(600)
    report['toast']=page.inner_text('#toast')
    report['toast_visible']=page.evaluate("() => document.getElementById('toast').classList.contains('show')")
    page.screenshot(path='qa/mobile-toast.png')
    # ics download
    with page.expect_download(timeout=15000) as dl:
        page.click('#icsBtn')
    d=dl.value
    path='qa/'+d.suggested_filename
    d.save_as(path)
    report['ics_file']=path
    report['ics_size']=__import__('os').path.getsize(path)
    # copy link button
    page.click('#copyLinkBtn'); page.wait_for_timeout(500)
    report['toast_link']=page.inner_text('#toast')
    # bottombar exists and fixed
    report['bottombar']=page.evaluate("() => {const e=document.getElementById('bottombar'); const r=e.getBoundingClientRect(); return {display:getComputedStyle(e).display, bottom:r.bottom, ih:innerHeight}}")
    ctx.close()

    # --- desktop
    ctx2=b.new_context(viewport={'width':1440,'height':900}, locale='ko-KR', timezone_id='Asia/Seoul')
    pg=ctx2.new_page()
    pg.goto(URL, wait_until='networkidle', timeout=60000)
    pg.wait_for_timeout(800)
    h=pg.evaluate("() => document.body.scrollHeight")
    for y in range(0,h,700):
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(100)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(400)
    pg.screenshot(path='qa/pc-top.png')
    pg.screenshot(path='qa/pc-full.png', full_page=True)
    report['pc_bottombar']=pg.evaluate("() => getComputedStyle(document.getElementById('bottombar')).display")
    report['pc_images_ok']=pg.evaluate("() => Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)")
    ctx2.close()
    b.close()

print(json.dumps(report, ensure_ascii=False, indent=1))
print('CONSOLE:', errors)
