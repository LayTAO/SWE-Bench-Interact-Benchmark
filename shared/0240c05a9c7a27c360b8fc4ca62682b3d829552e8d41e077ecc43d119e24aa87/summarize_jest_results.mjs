#!/usr/bin/env node

import fs from 'node:fs'

const [evaluationPath, mode, jestPath, outputPath, exitCodeText] = process.argv.slice(2)
const evaluation = JSON.parse(fs.readFileSync(evaluationPath, 'utf8'))
const jest = JSON.parse(fs.readFileSync(jestPath, 'utf8'))
const exitCode = Number(exitCodeText)

const assertions = new Map()
for (const suite of jest.testResults ?? []) {
  for (const assertion of suite.assertionResults ?? []) {
    const name = [...(assertion.ancestorTitles ?? []), assertion.title].join(' > ')
    assertions.set(name, assertion.status)
  }
}

function summarize(names) {
  let passed = 0
  let failed = 0
  const details = []
  for (const name of names) {
    const status = assertions.get(name) ?? 'missing'
    if (status === 'passed') passed += 1
    else failed += 1
    details.push({name, status})
  }
  return {passed, failed, details}
}

const f2p = summarize(evaluation.FAIL_TO_PASS ?? [])
const p2p = summarize(evaluation.PASS_TO_PASS ?? [])
const outcome = exitCode === 0 ? 'pass' : 'fail'
const record = {
  schema_version: '1.0',
  id: evaluation.id,
  instance_id: evaluation.instance_id,
  mode,
  outcome,
  exit_code: exitCode,
  phase: 'test',
  resolved: outcome === 'pass',
  test_scope: 'FAIL_TO_PASS+PASS_TO_PASS',
  test_command_source: 'environment/runner.json',
  FAIL_TO_PASS: {passed: f2p.passed, failed: f2p.failed},
  PASS_TO_PASS: {passed: p2p.passed, failed: p2p.failed},
  assertion_results: {
    FAIL_TO_PASS: f2p.details,
    PASS_TO_PASS: p2p.details,
  },
  raw_jest_result: `${mode}-jest.json`,
}

fs.writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(record, null, 2)}\n`)
