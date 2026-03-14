const { execSync } = require('child_process');
const { readdirSync, statSync } = require('fs');
const { join, extname } = require('path');

const ROOT = join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'coverage']);

const listFiles = (dir) => {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) {
        files.push(...listFiles(fullPath));
      }
      continue;
    }

    if (extname(fullPath) === '.js') {
      files.push(fullPath);
    }
  }

  return files;
};

const files = listFiles(ROOT);

for (const file of files) {
  execSync(`node --check "${file}"`, { stdio: 'pipe' });
}

console.log(`Lint passed: checked ${files.length} backend JS files.`);
