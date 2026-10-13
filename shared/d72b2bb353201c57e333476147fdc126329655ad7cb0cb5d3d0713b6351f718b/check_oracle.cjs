const fs = require('fs');

const [observationPath, oraclePath] = process.argv.slice(2);
const observation = JSON.parse(fs.readFileSync(observationPath, 'utf8'));
const oracle = JSON.parse(fs.readFileSync(oraclePath, 'utf8'));
const expected = oracle.expected || {};
const checks = {
  environment_valid: observation.environment_valid === true,
  rendering_valid: observation.rendering_valid === true,
  trigger_valid: observation.trigger_valid === true,
  initially_visible: observation.initially_visible === expected.initially_visible,
  scroll_triggered: observation.scroll_triggered === true,
  menu_open_after_scroll: observation.menu_open_after_scroll === expected.menu_open_after_scroll,
  bug_observed: observation.bug_observed === expected.bug_observed,
  action_error: observation.action_error === null,
};
const failed = Object.keys(checks).filter(name => !checks[name]);
if (failed.length) throw new Error(`canonical oracle failed: ${failed.join(', ')}`);
