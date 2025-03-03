const { launch } = require("puppeteer");

(async () => {
    // Launch puppeteer instance

    console.log("Launching Puppeteer browser...");

    const browser = await launch({
        headless: "new"
    });
    //In the near future `headless: true` will default to the new Headless mode headless: "new"
    const page = await browser.newPage();
    const discordToken = process.env.DISCORD_TOKEN; // Your Discord Token, How To Get Your Discord Token -> https://www.youtube.com/watch?v=YEgFvgg7ZPI&ab_channel=GaugingGadgets
    //Added env variable to secure token
    // Local Storage error with Puppeteer, found bypass, CREDIT: https://gist.github.com/zelbov/58e9fbbe5157bf61067d2693118dd09a

    const bypassLocalStorageOverride = (page) =>
        page.evaluateOnNewDocument(() => {
            // Preserve localStorage as separate var to keep it before any overrides
            let __ls = localStorage;

            // Restrict closure overrides to break global context reference to localStorage
            Object.defineProperty(window, "localStorage", {
                writable: false,
                configurable: false,
                value: __ls,
            });
        });

    console.log(
        "Redirecting to https://discord.com/app ... (May take a few seconds)"
    );

    // Calling function before storing token into Discord so that errors don't occur
    bypassLocalStorageOverride(page);

    await page.goto("https://discord.com/app");

    // Setting token into Discord Local Storage (Don't worry it's not being sent/stored anywhere, this is how Discord does it)
    await page.evaluate((token) => {
        localStorage.setItem("token", `"${token}"`);
    }, discordToken);

    // Navigate to a page where you want to use the local storage value
    await page.goto('https://discord.com/channels/@me/1345039358696095875'); // The discord channel / App Authorization that you want to log into Discord for...
    console.log("Successfully logged in...")

    await page.waitForSelector('[role="textbox"]');

    // await page.type('[role="textbox"][contenteditable="true"]', '/online');
    // page.keyboard.press('Enter');


    // autocomplete__13533
    // clickable__13533

    await page.type('[role="textbox"][contenteditable="true"]', '/fm item'); // Open command menu
    await page.waitForSelector('.clickable__13533'); // Wait for the command list to appear
    await page.click('.clickable__13533'); // Wait for the command list to appear
    await page.type('[role="textbox"][contenteditable="true"]', 'stone tiger head')
    // await page.type('[role="textbox"][contenteditable="true"]', 'online'); // Type the rest of the command
    await page.keyboard.press('Enter'); // Select the command
    // await page.keyboard.press('Enter'); // Send the message

    // Do whatever you want here afterwards, I just decided to take a screenshot for proof
    await page.screenshot({ path: 'output.png' })

    // Ending proccess
    await browser.close()
})();
