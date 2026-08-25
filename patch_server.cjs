const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

// Replace the static serving part
serverCode = serverCode.replace(
  "app.use(express.static(join(__dirname, 'dist')));\napp.get('*', (req, res) => {\n  res.sendFile(join(__dirname, 'dist', 'index.html'));\n});",
  "app.get('/', (req, res) => {\n  res.json({ status: 'active', message: 'WeatherGPT Backend is running!' });\n});"
);

fs.writeFileSync('server.js', serverCode);
console.log('Patched server.js');
