const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'backgrounds');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const images = {
  general: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1920&auto=format&fit=crop", // Stormy sky
  farmer: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1920&auto=format&fit=crop", // Agriculture field
  fisherman: "https://images.unsplash.com/photo-1544331454-e69d7a22cb18?q=80&w=1920&auto=format&fit=crop", // Dark ocean waves / boat
  aviation: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1920&auto=format&fit=crop", // Airplane
  urban: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1920&auto=format&fit=crop" // Rain city
};

Object.entries(images).forEach(([name, url]) => {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      https.get(res.headers.location, (res2) => {
        const stream = fs.createWriteStream(path.join(dir, `${name}.jpg`));
        res2.pipe(stream);
      });
    } else {
      const stream = fs.createWriteStream(path.join(dir, `${name}.jpg`));
      res.pipe(stream);
    }
  });
});

console.log("Downloading images...");
