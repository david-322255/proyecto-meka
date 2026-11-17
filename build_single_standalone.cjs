const fs = require('fs');
const path = require('path');

const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
let distHtml = fs.readFileSync(distHtmlPath, 'utf8');

// Replace any assets references with inline or base64
// 1. Inlining CSS
const cssMatches = distHtml.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+)">/g) || [];
for (const match of cssMatches) {
  const hrefMatch = match.match(/href="(\/assets\/[^"]+)"/);
  if (hrefMatch) {
    const cssPath = path.join(__dirname, 'dist', hrefMatch[1].replace(/^\//, ''));
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    // Replace url(/assets/...) in CSS with base64 data URLs
    cssContent = cssContent.replace(/url\((\/assets\/[^)]+)\)/g, (full, assetUrl) => {
      const assetPath = path.join(__dirname, 'dist', assetUrl.replace(/^\//, ''));
      if (fs.existsSync(assetPath)) {
        const ext = path.extname(assetPath).slice(1);
        const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
        const b64 = fs.readFileSync(assetPath).toString('base64');
        return `url("data:${mime};base64,${b64}")`;
      }
      return full;
    });
    distHtml = distHtml.replace(match, `<style>\n${cssContent}\n</style>`);
    console.log('Inlined CSS:', hrefMatch[1]);
  }
}

// 2. Inlining JS
const scriptMatches = distHtml.match(/<script type="module"[^>]*src="(\/assets\/[^"]+)"><\/script>/g) || [];
for (const match of scriptMatches) {
  const srcMatch = match.match(/src="(\/assets\/[^"]+)"/);
  if (srcMatch) {
    const jsPath = path.join(__dirname, 'dist', srcMatch[1].replace(/^\//, ''));
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Embed any referenced asset strings in JS as data URLs
    const assetFiles = fs.readdirSync(path.join(__dirname, 'dist', 'assets'));
    for (const file of assetFiles) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg')) {
        const ext = path.extname(file).slice(1);
        const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'application/octet-stream';
        const b64 = fs.readFileSync(path.join(__dirname, 'dist', 'assets', file)).toString('base64');
        const dataUrl = `data:${mime};base64,${b64}`;
        jsContent = jsContent.split(`/assets/${file}`).join(dataUrl);
      }
    }
    
    // Escape closing script tags
    const safeJs = jsContent.replace(/<\/script>/gi, '<\\/script>');
    distHtml = distHtml.replace(match, `<script type="module">\n${safeJs}\n</script>`);
    console.log('Inlined JS:', srcMatch[1]);
  }
}

// 3. Inlining favicon if needed
if (fs.existsSync('favicon.png')) {
  const favB64 = fs.readFileSync('favicon.png').toString('base64');
  distHtml = distHtml.replace(/href="\/favicon\.png"/g, `href="data:image/png;base64,${favB64}"`);
}

// Save standalone index.html
fs.writeFileSync(path.join(__dirname, 'index.html'), distHtml, 'utf8');
console.log('SUCCESS: Generated standalone root index.html!');
console.log('Size:', (fs.statSync('index.html').size / 1024).toFixed(2), 'KB');
