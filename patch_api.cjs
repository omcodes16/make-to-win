const fs = require('fs');

// Patch chatApi.js
let chatApi = fs.readFileSync('src/services/chatApi.js', 'utf8');
if (!chatApi.includes('import.meta.env.VITE_API_URL')) {
    chatApi = chatApi.replace("fetch('/api/chat'", "fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat`");
    fs.writeFileSync('src/services/chatApi.js', chatApi);
}

// Patch AlertsScreen.jsx
let alerts = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8');
if (!alerts.includes('import.meta.env.VITE_API_URL')) {
    alerts = alerts.replace("fetch('/api/news')", "fetch(`${import.meta.env.VITE_API_URL || ''}/api/news`)");
    fs.writeFileSync('src/components/AlertsScreen.jsx', alerts);
}

console.log("Patched API calls!");
