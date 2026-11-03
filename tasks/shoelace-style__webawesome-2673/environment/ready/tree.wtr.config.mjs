import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import upstream from '/workspace/repo/packages/webawesome/web-test-runner.config.js';
const requireRepo = createRequire('/workspace/repo/package.json');
const {playwrightLauncher} = await import(pathToFileURL(requireRepo.resolve('@web/test-runner-playwright')));
export default {...upstream, concurrentBrowsers: 1,
  browsers: [playwrightLauncher({product: 'chromium', concurrency: 1, launchOptions: {args: ['--no-sandbox']}})]};
