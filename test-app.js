const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });
    
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.toString());
    });

    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    console.log('Page loaded. Checking for buttons...');
    const buttons = await page.$$('header button');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Weather View') || text.includes('Mausam')) {
        console.log('Clicking Weather View button...');
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log('Could not find Weather View button.');
    }

    // Wait a bit to let React crash if it's going to
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Done testing.');
    await browser.close();
  } catch (err) {
    console.error('Test script error:', err);
  }
})();
