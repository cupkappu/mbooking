const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://10.66.35.155:8068/login', { timeout: 30000 });
    console.log('Login page loaded');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('Logged in successfully');
    
    // Navigate to settings
    await page.goto('http://10.66.35.155:8068/settings');
    await page.waitForLoadState('networkidle');
    console.log('Settings page loaded');
    
    // Check that General tab is visible
    const generalTab = await page.locator('text=General').first();
    if (await generalTab.isVisible()) {
      console.log('General tab is visible');
    }
    
    // Check available tabs
    const tabs = await page.locator('button:has-text("General"), button:has-text("Currencies"), button:has-text("Rate Providers")').all();
    console.log('Number of tabs found:', tabs.length);
    
    // Click on Currencies tab
    await page.click('text=Currencies');
    await page.waitForLoadState('networkidle');
    console.log('Currencies tab clicked');
    
    // Check that Currency Management is visible
    const currencyMgmt = await page.locator('h2:has-text("Currency Management")');
    if (await currencyMgmt.isVisible()) {
      console.log('Currency Management section is visible');
    }
    
    // Check that Add New Currency section is NOT visible
    const addCurrencySection = await page.locator('text=Add New Currency');
    const isAddVisible = await addCurrencySection.isVisible().catch(() => false);
    console.log('Add New Currency section visible:', isAddVisible);
    
    // Check that Rate Providers tab is NOT visible
    const rateProvidersTab = await page.locator('text=Rate Providers');
    const isProvidersVisible = await rateProvidersTab.isVisible().catch(() => false);
    console.log('Rate Providers tab visible:', isProvidersVisible);
    
    // Check that "Set Default" button exists
    const setDefaultBtn = await page.locator('text=Set Default').first();
    if (await setDefaultBtn.isVisible()) {
      console.log('Set Default button is visible');
      
      // Click Set Default
      await setDefaultBtn.click();
      console.log('Clicked Set Default button');
      
      // Wait a bit for the API call
      await page.waitForTimeout(2000);
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
