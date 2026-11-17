const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Fix export default
app = app.replace('export default \nclass SafeErrorBoundary', 'class SafeErrorBoundary');
app = app + '\n\nexport default App;\n';

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log('Fixed export default App in src/App.tsx!');
