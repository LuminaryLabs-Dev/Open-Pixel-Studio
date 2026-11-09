#!/usr/bin/env python3
"""SG-2 full-editor Chromium smoke. Run manually, never in GitHub Actions.
Requires pip install playwright, Chromium installed.
PIXEL_CHROMIUM=/usr/bin/chromium python docs/qa/sg-2/browser-selection-smoke.py
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[3]
html=(root/"studio"/"standalone.html").read_text(encoding="utf8")
with sync_playwright() as pw:
    options={"headless":True,"args":["--no-sandbox"]}
    if os.environ.get("PIXEL_CHROMIUM"):
        options["executable_path"]=os.environ["PIXEL_CHROMIUM"]
    browser=pw.chromium.launch(**options)
    page=browser.new_page(viewport={"width":1440,"height":900})
    errors=[]
    page.on("pageerror",lambda exc:errors.append(str(exc)))
    page.set_content(html,wait_until="domcontentloaded")
    page.wait_for_function("window.NexusStudio && window.NexusStudio.getInfo().width > 0")
    assert page.locator("#sg2SelectionCanvas").count()==1
    w,h=page.evaluate("[project.width,project.height]")
    box=page.locator("#artboard").bounding_box()
    assert box and box["width"]>0 and box["height"]>0
    def at(x,y):
        return box["x"]+(x+.5)*box["width"]/w,box["y"]+(y+.5)*box["height"]/h
    def drag(tool,a,b):
        page.evaluate("(tool)=>setTool(tool)",tool)
        page.mouse.move(*at(*a));page.mouse.down()
        page.mouse.move(*at(*b),steps=8);page.mouse.up()
        return page.evaluate("state.selectionMask.reduce((sum,p)=>sum+p,0)")
    assert drag("select",(1,1),(5,5))==25
    e=drag("select-ellipse",(1,1),(9,9));assert 0<e<81,e
    page.evaluate("sg2SetSelection(null);setTool('select-wand')")
    page.mouse.click(*at(12,12))
    assert page.evaluate("state.selectionMask.reduce((sum,p)=>sum+p,0)")>0
    page.evaluate("sg2SelectAll()")
    assert page.evaluate("state.selectionMask.reduce((sum,p)=>sum+p,0)")==w*h
    page.evaluate("sg2SetSelection(null)")
    assert page.evaluate("state.selection===null")
    assert not errors,errors
    print("SG-2 full-editor Chromium selection smoke PASS")
    browser.close()
