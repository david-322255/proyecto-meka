import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'android' && entry.name !== 'www') {
        copyDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const wwwDir = path.resolve('www');
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

// 1. Copy root index.html to www/index.html
fs.copyFileSync('index.html', path.join(wwwDir, 'index.html'));
console.log('Copied root index.html to www/index.html');

// 2. Copy static assets if they exist
const foldersToCopy = ['assets', 'public', 'css', 'js'];
for (const folder of foldersToCopy) {
  if (fs.existsSync(folder)) {
    copyDir(folder, path.join(wwwDir, folder));
    console.log(`Copied ${folder} to www/${folder}`);
  }
}

if (fs.existsSync('favicon.png')) {
  fs.copyFileSync('favicon.png', path.join(wwwDir, 'favicon.png'));
}

console.log('www directory sync completed.');
