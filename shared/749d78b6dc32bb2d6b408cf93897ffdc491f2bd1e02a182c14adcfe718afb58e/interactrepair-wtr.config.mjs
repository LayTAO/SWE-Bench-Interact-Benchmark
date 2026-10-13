import base from './web-test-runner.config.mjs';
import {chromeLauncher} from '@web/test-runner-chrome';
import {defaultReporter} from '@web/test-runner';
import {interactRepairReporter} from '/tests/verifier/interactrepair-wtr-reporter.mjs';

export default {
  ...base,
  concurrency: 1,
  coverage: false,
  coverageConfig: {
    ...base.coverageConfig,
    report: false,
    threshold: {statements: 0, branches: 0, functions: 0, lines: 0},
  },
  browsers: [chromeLauncher({launchOptions: {
    executablePath: '/ms-playwright/chromium-1208/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }})],
  reporters: [defaultReporter(), interactRepairReporter()],
};
