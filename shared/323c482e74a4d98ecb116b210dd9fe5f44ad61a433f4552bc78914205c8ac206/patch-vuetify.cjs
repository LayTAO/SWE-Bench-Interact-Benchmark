const fs = require('fs');
const path = '/workspace/subject/packages/vuetify/vitest.config.ts';
let text = fs.readFileSync(path, 'utf8');
const launch = 'launchOptions: {\n                    ignoreDefaultArgs:';
if (text.includes(launch)) text = text.replace(launch,
  'launchOptions: {\n                    executablePath: process.env.INTERACT_CHROME_PATH,\n                    ignoreDefaultArgs:');
const args = "args: [\n                      '--start-maximized',";
if (text.includes(args)) text = text.replace(args,
  "args: [\n                      '--no-sandbox',\n                      '--disable-setuid-sandbox',\n                      '--start-maximized',");
fs.writeFileSync(path, text);
