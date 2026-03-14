import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const filesOutput = execSync('rg --files src', { encoding: 'utf8' });
const files = filesOutput.split('\n').filter(Boolean);

const disallowedMarkers = ['<<<<<<<', '=======', '>>>>>>>'];

for (const file of files) {
  const content = readFileSync(file, 'utf8');

  for (const marker of disallowedMarkers) {
    if (content.includes(marker)) {
      throw new Error(`Conflict marker "${marker}" found in ${file}`);
    }
  }
}

console.log(`Lint passed: checked ${files.length} frontend source files for conflict markers.`);
