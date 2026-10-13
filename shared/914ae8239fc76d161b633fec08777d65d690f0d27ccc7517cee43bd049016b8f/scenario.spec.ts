import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('modal Dialog honors explicit outside-pointer control', async ({page, browserName}) => {
  const expectedBug=process.env.EXPECT_BUG==='true'; const consoleErrors:string[]=[]; const pageErrors:string[]=[]
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())}); page.on('pageerror',e=>pageErrors.push(e.stack??e.message))
  const observation:Record<string,any>={schema_version:'1.0',instance_id:'unovue__reka-ui-2677',mode:process.env.REPRO_MODE,browser_name:browserName,browser_version:page.context().browser()?.version()??null,viewport:page.viewportSize(),workers:1,retries:0,environment_valid:false,rendering_valid:false,trigger_valid:false,bug_observed:false,action_error:null}
  try{
    await page.goto('/',{waitUntil:'domcontentloaded'}); await page.getByTestId('open-false').click(); const falseDialog=page.getByTestId('dialog-false'); await expect(falseDialog).toBeVisible(); await page.waitForTimeout(120)
    const pointerWhenFalse=await page.locator('body').evaluate(e=>(e as HTMLElement).style.pointerEvents); const falseBox=await falseDialog.boundingBox(); await page.getByTestId('close-false').click(); await expect(falseDialog).toBeHidden(); await page.waitForTimeout(120)
    await page.getByTestId('open-true').click(); const trueDialog=page.getByTestId('dialog-true'); await expect(trueDialog).toBeVisible(); await page.waitForTimeout(120)
    const pointerWhenTrue=await page.locator('body').evaluate(e=>(e as HTMLElement).style.pointerEvents); const trueBox=await trueDialog.boundingBox(); const card=await page.locator('.card').boundingBox();
    const fixedState=pointerWhenFalse!=='none'&&pointerWhenTrue==='none'; Object.assign(observation,{environment_valid:pageErrors.length===0&&consoleErrors.length===0,rendering_valid:Boolean(card&&falseBox&&trueBox&&card.width>=500&&card.height>=180&&falseBox.width>=400&&falseBox.height>=140&&trueBox.width>=400&&trueBox.height>=140),trigger_valid:Boolean(falseBox&&trueBox),bug_observed:!fixedState,body_pointer_events_when_false:pointerWhenFalse,body_pointer_events_when_true:pointerWhenTrue,false_dialog:falseBox,true_dialog:trueBox})
  }catch(error){observation.action_error=error instanceof Error?`${error.name}: ${error.message}`:String(error)}
  Object.assign(observation,{console_errors:consoleErrors,page_errors:pageErrors}); fs.mkdirSync('/results',{recursive:true}); fs.writeFileSync('/results/observation.json',`${JSON.stringify(observation,null,2)}\n`); await page.screenshot({path:`/results/${process.env.REPRO_MODE}-screenshot.png`,fullPage:true}).catch(()=>{})
  expect(observation.action_error).toBeNull(); expect(observation.environment_valid).toBe(true); expect(observation.rendering_valid).toBe(true); expect(observation.trigger_valid).toBe(true); expect(observation.bug_observed).toBe(expectedBug)
})
