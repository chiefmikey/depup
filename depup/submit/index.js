#!/usr/bin/env node
const pkg = process.argv[2];

if (!pkg || pkg === '--help' || pkg === '-h') {
  console.log('Usage: npx @depup/submit <package-name>');
  console.log('');
  console.log('Examples:');
  console.log('  npx @depup/submit express');
  console.log('  npx @depup/submit @nestjs/core');
  process.exit(pkg ? 0 : 1);
}

const REPO = 'chiefmikey/depup';
const flat = pkg.startsWith('@') ? pkg.slice(1).replace('/', '__') : pkg;

async function run() {
  process.stdout.write('Checking @depup/' + flat + '...');

  try {
    const r = await fetch('https://registry.npmjs.org/@depup/' + flat);
    if (r.ok) {
      const data = await r.json();
      const version = data['dist-tags'] && data['dist-tags'].latest;
      console.log(' already published!');
      console.log('');
      console.log('  npm install @depup/' + flat);
      console.log('  https://www.npmjs.com/package/@depup/' + flat);
      if (version) {
        try {
          const vr = await fetch('https://registry.npmjs.org/@depup/' + flat + '/' + version);
          if (vr.ok) {
            const vd = await vr.json();
            const changes = vd.depup && vd.depup.changes;
            if (changes && Object.keys(changes).length > 0) {
              console.log('');
              console.log('  Dependencies bumped:');
              for (const [dep, ch] of Object.entries(changes)) {
                console.log('    ' + dep + ': ' + ch.from + ' -> ' + ch.to);
              }
            }
          }
        } catch(e) {}
      }
      process.exit(0);
    }
  } catch(e) {}

  console.log(' not found.');

  try {
    const { execFileSync } = require('child_process');
    execFileSync('gh', ['--version'], { stdio: 'pipe' });

    console.log('Submitting package request...');
    const issueUrl = execFileSync('gh', [
      'issue', 'create', '--repo', REPO,
      '--title', 'Add package: ' + pkg,
      '--body', '### Package Name\n\`' + pkg + '\`\n\n### Reason\nSubmitted via npx @depup/submit',
      '--label', 'package-request',
    ], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();

    console.log('Submitted: ' + issueUrl);
    console.log('De Pup is processing...');

    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const r = await fetch('https://registry.npmjs.org/@depup/' + flat);
        if (r.ok) {
          const data = await r.json();
          const version = data['dist-tags'] && data['dist-tags'].latest;
          console.log('');
          console.log('Published: @depup/' + flat + '@' + version);
          console.log('  npm install @depup/' + flat);
          console.log('  ' + issueUrl);
          process.exit(0);
        }
      } catch(e) {}
      const elapsed = (i + 1) * 5;
      process.stdout.write('\rWaiting... ' + Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0'));
    }
    console.log('');
    console.log('Timed out. Check ' + issueUrl);
    process.exit(1);
  } catch(e) {
    console.log('');
    console.log('Submit via GitHub:');
    const title = encodeURIComponent('Add package: ' + pkg);
    const body = encodeURIComponent('### Package Name\n\`' + pkg + '\`\n\n### Reason\nPackage request');
    console.log('  https://github.com/' + REPO + '/issues/new?labels=package-request&title=' + title + '&body=' + body);
    console.log('');
    console.log('Or install gh CLI: https://cli.github.com');
    process.exit(1);
  }
}
run();
