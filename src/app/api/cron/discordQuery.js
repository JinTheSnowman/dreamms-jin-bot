import { launch } from "puppeteer";
import client from "../../lib/mongodb";

// Define your query array
const QUERIES = ["taru totem", "stone tiger head", "white scroll"];
const FREQUENCY = 5;

export default async function handler(req, res) {

  // Calculate the index based on the current time.
  // This divides the current time (in milliseconds) by 5 minutes,
  // then takes the result modulo the length of the queries array.
  const currentTime = Date.now();
  const cycleIndex = Math.floor(currentTime / (FREQUENCY * 60 * 1000)) % QUERIES.length;
  const queryString = QUERIES[cycleIndex];

  try {
    console.log("Launching Puppeteer browser...");
    const browser = await launch({
      headless: "new",
      // You may need to add additional args/options for a serverless environment
      // See: https://github.com/puppeteer/puppeteer/issues/6602
    });
    const page = await browser.newPage();
    const discordToken = process.env.DISCORD_TOKEN;

    // Bypass local storage override
    await page.evaluateOnNewDocument(() => {
      const __ls = localStorage;
      Object.defineProperty(window, "localStorage", {
        writable: false,
        configurable: false,
        value: __ls,
      });
    });

    console.log("Redirecting to Discord...");
    await page.goto("https://discord.com/app");

    // Set token into Discord local storage
    await page.evaluate((token) => {
      localStorage.setItem("token", `"${token}"`);
    }, discordToken);

    // Navigate to desired channel
    await page.goto("https://discord.com/channels/@me/1264454944354734100");
    console.log("Successfully logged in...");

    // Wait for the chat textbox to appear
    try {
      await page.waitForSelector('[role="textbox"]', { timeout: 120000 });
    } catch (error) {
      await page.screenshot({ path: 'tmp/output-fail.png' });
    }

    console.log("Sending query...");
    await page.type('[role="textbox"][contenteditable="true"]', '/fm item');
    await page.waitForSelector('.clickable__13533');
    await page.click('.clickable__13533');
    await page.type('[role="textbox"][contenteditable="true"]', queryString);
    await page.keyboard.press('Enter');

    await page.screenshot({ path: 'tmp/output.png' });
    console.log("Query sent, waiting for network...");

    // Wait for the command to be processed
    await page.waitForFunction(() => {
      return ![...document.querySelectorAll('div')]
        .some(el => el.innerText.trim() === "Sending command...");
    });
    await page.screenshot({ path: 'tmp/output-2.png' });

    await page.waitForFunction(() => {
      return ![...document.querySelectorAll('div')]
        .some(el => el.innerText.trim() === "DreamBot is thinking...");
    });
    await page.screenshot({ path: 'tmp/output-3.png' });

    // Extract data from the page
    const data = await page.evaluate(() => {
      const lastLi = document.querySelector('ol.scrollerInner__36d07 li:last-of-type');
      if (!lastLi) return null;

      const name = lastLi.querySelector('.embedTitle__623de span')?.innerText.trim();
      const id = lastLi.querySelector('.embedDescription__623de a')?.innerText.trim();

      const listings = [];
      lastLi.querySelectorAll('.embedDescription__623de').forEach(desc => {
        const regex = /([\d,]+)\s*\[([\d]+)\]・\s*([\w\d]+)/g;
        let match;
        while ((match = regex.exec(desc.innerText)) !== null) {
          listings.push({
            price: match[1].replaceAll(',', ''),
            qty: parseInt(match[2], 10),
            seller: match[3]
          });
        }
      });

      return { name, id, listings };
    });

    console.log("Data extracted:", data);

    // Store the data in MongoDB
    const db = client.db(process.env.DB_NAME);
    await db.collection('listings').insertOne(data);

    // Clean up
    await browser.close();

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in Discord query:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
