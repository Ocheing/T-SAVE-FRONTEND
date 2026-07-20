const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();

    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            console.log(`[${type.toUpperCase()}] ${msg.text()}`);
        }
    });
    
    page.on('pageerror', err => {
        console.log(`[PAGE ERROR] ${err.toString()}`);
    });

    try {
        console.log('Navigating to localhost:8080...');
        await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('Navigating to admin/events...');
        await page.goto('http://localhost:8080/admin/events', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));

        console.log('Navigating to events...');
        await page.goto('http://localhost:8080/events', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
        console.log('Error during navigation:', e);
    }

    console.log('Done.');
    await browser.close();
})();
