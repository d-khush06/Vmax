const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/login');
  
  // Wait for the buttons to appear
  await page.waitForSelector('button');
  
  // Try to click Google
  console.log("Clicking Google...");
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Google')) {
      await btn.click();
      break;
    }
  }

  // Wait 2 seconds to see what happens
  await new Promise(r => setTimeout(r, 2000));
  
  // Try Email / Password
  console.log("Typing email/password...");
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].type('test@example.com');
    await inputs[1].type('password123');
  }
  
  console.log("Clicking Sign In...");
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Sign In') && !text.includes('Sign in')) {
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
