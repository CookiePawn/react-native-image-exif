const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'lib/module/index.js',
  'lib/typescript/src/index.d.ts',
];

const missing = requiredFiles.filter((p) => {
  try {
    fs.accessSync(path.join(__dirname, '..', p), fs.constants.R_OK);
    return false;
  } catch {
    return true;
  }
});

if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    [
      'Build outputs are missing:',
      ...missing.map((p) => `- ${p}`),
      '',
      'Run `yarn prepare` (bob build) before publishing, or commit the built `lib/` folder.',
    ].join('\n')
  );
  process.exit(1);
}

