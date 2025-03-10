import client from "../../../../../../lib/mongodb";

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";


const QUERIES = ["taru totem", "stone tiger head", "white scroll"];

export const maxDuration = 120;
// https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar

async function getBrowser() {
  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
  )

  return puppeteer.launch({
    executablePath,
    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

export async function GET(request) {
  // Calculate the index based on the current time.
  const currentTime = Date.now();
  const cycleIndex = Math.floor(currentTime / (FREQUENCY * 60 * 1000)) % QUERIES.length;
  const queryString = QUERIES[cycleIndex];

  try {

    const browser = await getBrowser()

    const page = await browser.newPage();
    const discordToken = process.env.DISCORD_TOKEN;

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

    await page.evaluate((token) => {
      localStorage.setItem("token", `"${token}"`);
    }, discordToken);

    await page.goto("https://discord.com/channels/@me/1264454944354734100");
    console.log("Successfully logged in...");

    await page.waitForSelector('[role="textbox"]', { timeout: 120000 });

    console.log("Sending query...");
    await page.type('[role="textbox"][contenteditable="true"]', '/fm item');
    await page.waitForSelector('.clickable__13533');
    await page.click('.clickable__13533');
    await page.type('[role="textbox"][contenteditable="true"]', queryString);
    await page.keyboard.press('Enter');

    const queryTime = Date.now();

    console.log("Query sent, waiting for network...");

    await page.waitForFunction(() => {
      return ![...document.querySelectorAll('div')]
        .some(el => el.innerText.trim() === "Sending command...");
    });

    await page.waitForFunction(() => {
      return ![...document.querySelectorAll('div')]
        .some(el => el.innerText.trim() === "DreamBot is thinking...");
    });

    const listingData = await page.evaluate(() => {
      const lastLi = document.querySelector('ol.scrollerInner__36d07 li:last-of-type');
      if (!lastLi) return null;

      const name = lastLi.querySelector('.embedTitle__623de span')?.innerText.trim();
      const itemId = lastLi.querySelector('.embedDescription__623de a')?.innerText.trim();

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

      return { name, itemId, listings };
    });

    const data = { queryTime, ...listingData }

    console.log("Data extracted:", data);

    const db = client.db(process.env.DB_NAME);
    await db.collection('listings').insertOne(data);

    await browser.close();

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in Discord query:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
