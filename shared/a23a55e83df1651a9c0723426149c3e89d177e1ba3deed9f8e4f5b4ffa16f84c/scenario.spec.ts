import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('forwarded currentElement reacts when a conditional as-child root changes', async ({page, browserName}) => {
  const expectedBug=process.env.EXPECT_BUG==='true'; const consoleErrors:string[]=[]; const pageErrors:string[]=[]
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())}); page.on('pageerror',e=>pageErrors.push(e.stack??e.message))
  const observation:Record<string,any>={schema_version:'1.0',instance_id:'unovue__reka-ui-2474',mode:process.env.REPRO_MODE,browser_name:browserName,browser_version:page.context().browser()?.version()??null,viewport:page.viewportSize(),workers:1,retries:0,environment_valid:false,rendering_valid:false,trigger_valid:false,bug_observed:false,action_error:null}
  try{
    await page.goto('/',{waitUntil:'domcontentloaded'}); const output=page.getByTestId('observed-tag'); await expect(output).toContainText('button'); const first=page.getByTestId('mixer-a'); const firstBox=await first.boundingBox()
    await page.getByTestId('reload').click(); const second=page.getByTestId('mixer-b'); await expect(second).toBeVisible(); await page.waitForTimeout(160); const secondBox=await second.boundingBox(); const observed=(await output.textContent())?.trim()??''; const actualTag=await second.evaluate(e=>e.nodeName.toLowerCase()); const card=await page.locator('.card').boundingBox(); const stage=await page.locator('.swap-stage').boundingBox()
    Object.assign(observation,{environment_valid:pageErrors.length===0&&consoleErrors.length===0,rendering_valid:Boolean(card&&stage&&firstBox&&secondBox&&card.width>=500&&card.height>=300&&stage.width>=600&&stage.height>=200&&firstBox.height>=38&&secondBox.height>=38),trigger_valid:Boolean(firstBox&&secondBox&&actualTag==='span'&&secondBox.x-firstBox.x>=400),bug_observed:!observed.endsWith('span'),observed_after_swap:observed,actual_dom_tag_after_swap:actualTag,first_trigger:firstBox,second_trigger:secondBox})
  }catch(error){observation.action_error=error instanceof Error?`${error.name}: ${error.message}`:String(error)}
  Object.assign(observation,{console_errors:consoleErrors,page_errors:pageErrors}); fs.mkdirSync('/results',{recursive:true}); fs.writeFileSync('/results/observation.json',`${JSON.stringify(observation,null,2)}\n`); await page.screenshot({path:`/results/${process.env.REPRO_MODE}-screenshot.png`,fullPage:true}).catch(()=>{})
  expect(observation.action_error).toBeNull(); expect(observation.environment_valid).toBe(true); expect(observation.rendering_valid).toBe(true); expect(observation.trigger_valid).toBe(true); expect(observation.bug_observed).toBe(expectedBug)
})
