const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 Starting Comprehensive Headless Browser Check for WeatherGPT...');
  const logs = [];
  const errors = [];
  const failedRequests = [];

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    // Filter out harmless React dev warnings if any
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${text}`);
    } else {
      logs.push(`[Console ${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`[Page Uncaught Exception] ${error.message}`);
  });

  page.on('requestfailed', request => {
    // Ignore aborted or external favicon if any
    const url = request.url();
    if (!url.includes('google-analytics') && !url.includes('chrome-extension')) {
      failedRequests.push(`[Network Failed] ${url}: ${request.failure()?.errorText}`);
    }
  });

  try {
    // 1. Visit Chat (Home)
    console.log('1️⃣ Navigating to Home / Chat (http://localhost:5173/)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('header', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home_chat.png'), fullPage: true });
    console.log('✅ Home / Chat loaded. Screenshot saved.');

    // 2. Test Weather Dashboard (Stage)
    console.log('2️⃣ Navigating to Weather Dashboard (/stage)...');
    await page.goto('http://localhost:5173/stage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_weather_dashboard.png'), fullPage: true });
    console.log('✅ Weather Dashboard loaded. Screenshot saved.');

    // 3. Test Alerts Screen (/alerts)
    console.log('3️⃣ Navigating to Live Disaster Alerts (/alerts)...');
    await page.goto('http://localhost:5173/alerts', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_alerts_screen.png'), fullPage: true });
    console.log('✅ Alerts Screen loaded. Screenshot saved.');

    // 4. Test Reviews Screen (/reviews)
    console.log('4️⃣ Navigating to Reviews Screen (/reviews)...');
    await page.goto('http://localhost:5173/reviews', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_reviews_screen.png'), fullPage: true });
    console.log('✅ Reviews Screen loaded. Screenshot saved.');

    // 5. Test Manager Portal (/manager)
    console.log('5️⃣ Navigating to Disaster Manager Portal (/manager)...');
    await page.goto('http://localhost:5173/manager', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if passcode prompt is present and fill passcode
    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      console.log('🔑 Entering manager passcode "weather2026"...');
      await passInput.type('weather2026');
      const submitBtn = await page.$('button[type="submit"]') || await page.$('form button');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_manager_dashboard.png'), fullPage: true });
    console.log('✅ Manager Dashboard loaded. Screenshot saved.');

    // 6. Test Interactive Chat Submission
    console.log('6️⃣ Testing interactive Chat query on Home screen...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Find chat input
    const chatInput = await page.$('form.glass-input input[type="text"]') || await page.$('input[type="text"]') || await page.$('textarea');
    if (chatInput) {
      console.log('💬 Typing question: "What is the temperature in Guwahati today?"');
      await chatInput.type('What is the temperature in Guwahati today?');
      // Click submit button
      const submitBtn = await page.$('form.glass-input button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      console.log('⏳ Waiting for AI reply and weather widget...');
      // Wait for response bubble to appear
      await new Promise(r => setTimeout(r, 14000));
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_chat_interaction.png'), fullPage: true });
      console.log('✅ Chat interaction completed. Screenshot saved.');
    } else {
      console.log('⚠️ Chat input element not found.');
    }

    // 7. Test Location Search on Weather Dashboard
    console.log('7️⃣ Testing Location Search on Weather Dashboard (/stage)...');
    await page.goto('http://localhost:5173/stage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const searchInput = await page.$('input[placeholder*="Search city"], input[placeholder*="Search"]');
    if (searchInput) {
      console.log('🔍 Typing "Guwahati" in city search...');
      await searchInput.type('Guwahati');
      await new Promise(r => setTimeout(r, 1500));
      // Check for suggestion item or click submit button
      const suggestion = await page.$('ul li');
      if (suggestion) {
        console.log('📍 Clicking first suggestion...');
        await suggestion.click();
      } else {
        const submitBtn = await page.$('form button[type="submit"]');
        if (submitBtn) await submitBtn.click();
      }
      console.log('⏳ Waiting for weather charts and forecast...');
      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_weather_stage_loaded.png'), fullPage: true });
      console.log('✅ Weather stage loaded with full analytics. Screenshot saved.');
    }

    // 8. Test Official Bulletin Modal
    console.log('8️⃣ Testing Official IMD Weather Bulletin Modal...');
    const bulletinBtn = await page.$('header button:has(span), header button');
    // Find button containing 'Bulletin'
    const buttons = await page.$$('header button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Bulletin')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_bulletin_modal.png') });
        console.log('✅ Bulletin modal opened. Screenshot saved.');
        // Close modal by pressing Escape
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }

    // 9. Test SOS Emergency Modal
    console.log('9️⃣ Testing Global SOS Emergency Modal...');
    // Ensure any open dialog is closed
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
    const sosBtn = await page.$('button.fixed.bottom-6.right-6') || await page.$('button[title*="Emergency SOS"]');
    if (sosBtn) {
      await sosBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_sos_modal.png') });
      console.log('✅ SOS modal opened. Screenshot saved.');
    } else {
      console.log('⚠️ SOS button not found.');
    }

    console.log('\n📊 === TEST SUMMARY ===');
    console.log(`Errors encountered: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach(e => console.error('❌ ' + e));
    } else {
      console.log('🎉 Zero uncaught page exceptions or severe console errors!');
    }

    console.log(`Failed network requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      failedRequests.forEach(f => console.warn('⚠️ ' + f));
    } else {
      console.log('🎉 Zero failed network requests!');
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
    console.log('🏁 Browser test finished.');
  }
})();
