import fs from 'node:fs'
import path from 'node:path'
import {chromium} from 'playwright'
const [variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!['buggy','fixed'].includes(variant) || !baseURL || !outputDir || !executablePath) throw new Error('capture arguments missing')
fs.mkdirSync(outputDir, {recursive:true})
const errors=[]
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-setuid-sandbox']})
const context=await browser.newContext({viewport:{width:960,height:600},recordVideo:{dir:path.join(outputDir,'.video'),size:{width:960,height:600}}})
await context.tracing.start({screenshots:true,snapshots:true,sources:true})
const page=await context.newPage(); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())}); page.on('pageerror',e=>errors.push(e.message))
await page.goto(baseURL,{waitUntil:'domcontentloaded',timeout:10000}); await page.waitForTimeout(100)
const monthButton=page.getByTestId('month-select-button'); await monthButton.click(); const july=page.getByRole('option',{name:'July'}); await july.click(); await page.waitForTimeout(150)
const observation=await page.evaluate(()=>{const active=document.activeElement; const grid=document.querySelector('[role="grid"]'); const cell=active?.closest('[role="gridcell"]'); return {active_tag:active?.tagName||'',active_role:active?.getAttribute('role')||'',active_testid:active?.getAttribute('data-testid')||'',active_text:active?.textContent?.trim()||'',grid_focused:active===grid||!!cell,month_button_text:document.querySelector('[data-testid="month-select-button"]')?.textContent?.replace(/\s+/g,' ').trim()||''}})
const relevantErrors=errors.filter(e=>!/favicon|404/.test(e)); const precondition=observation.month_button_text.includes('June')||observation.month_button_text.includes('July'); const bugState=observation.grid_focused; const fixedState=!observation.grid_focused&&observation.active_testid==='month-select-button'; const oraclePassed=precondition&&relevantErrors.length===0&&(variant==='buggy'?bugState:fixedState)
await page.screenshot({path:path.join(outputDir,`${variant}-screenshot.png`),fullPage:true}); const video=page.video(); await context.tracing.stop({path:path.join(outputDir,`${variant}-trace.zip`)}); await context.close(); if(video)fs.renameSync(await video.path(),path.join(outputDir,`${variant}-video.webm`)); await browser.close()
const payload={schema_version:'1.0',instance_id:'adobe__react-spectrum-9427',variant,precondition,...observation,console_errors:relevantErrors,environment_valid:true,rendering_valid:true,trigger_valid:true,oracle_passed:oraclePassed,bug_observed:variant==='buggy'?oraclePassed:!oraclePassed,used_for_scoring:false}; fs.writeFileSync(path.join(outputDir,'observation.json'),`${JSON.stringify(payload,null,2)}\n`); console.log(JSON.stringify(payload)); if(!oraclePassed)process.exit(9)
