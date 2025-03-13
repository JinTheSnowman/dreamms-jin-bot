import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

import client from "../../../../../../lib/mongodb";
import { CHROMIUM_ARGS } from "../../../../../../lib/browser";

const ITEM_TRACK_LIST = process.env.ITEM_TRACK_LIST || [
  "taru totem",
  "stone tiger head",
  "white scroll",
  "chaos scroll",
  "clean slate scroll 10%",
  "clean slate scroll 20%",
];
const FREQUENCY = 10;

const CHROMIUM_EXECUTABLE_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar";

const DISCORD_URL =
  "https://discord.com/channels/1246521134866890875/1349566765348425770";

export const maxDuration = 300;

let page;

const getBrowser = async () => {
  if (process.env.NODE_ENV === "development") {
    return await puppeteer.launch({
      args: CHROMIUM_ARGS,
      defaultViewport: chromium.defaultViewport,
      headless: true,
      ignoreHTTPSErrors: true,
    });
  } else {
    const executablePath = await chromium.executablePath(
      CHROMIUM_EXECUTABLE_URL,
    );

    return await puppeteerCore.launch({
      executablePath,
      args: CHROMIUM_ARGS,
      defaultViewport: chromium.defaultViewport,
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }
};

export async function GET(request) {
  // Calculate the index based on the current time.
  const currentTime = Date.now();
  const cycleIndex =
    Math.floor(currentTime / (FREQUENCY * 60 * 1000)) % ITEM_TRACK_LIST.length;
  const queryString = ITEM_TRACK_LIST[cycleIndex];

  try {
    const browser = await getBrowser();

    page = await browser.newPage();
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

    await page.goto(DISCORD_URL, { timeout: 60000 });

    await page.waitForSelector('[role="textbox"]', { timeout: 30000 });
    console.log("Successfully logged in...");

    console.log("Sending query...");
    await page.type('[role="textbox"][contenteditable="true"]', "/fm item");
    await page.waitForSelector(".clickable__13533");
    await page.click(".clickable__13533");
    await page.type('[role="textbox"][contenteditable="true"]', queryString);
    await page.keyboard.press("Enter");

    const snapshotAt = Date.now();

    console.log("Query sent, waiting for network...");

    await page.waitForFunction(() => {
      return ![...document.querySelectorAll("div")].some(
        (el) => el.innerText.trim() === "Sending command...",
      );
    });

    await page.waitForFunction(() => {
      return ![...document.querySelectorAll("div")].some(
        (el) => el.innerText.trim() === "DreamBot is thinking...",
      );
    });

    const listingData = await page.evaluate(() => {
      const lastLi = document.querySelector(
        "ol.scrollerInner__36d07 li:last-of-type",
      );
      if (!lastLi) return null;

      const name = lastLi
        .querySelector(".embedTitle__623de span")
        ?.innerText.trim();
      const itemId = lastLi
        .querySelector(".embedDescription__623de a")
        ?.innerText.trim();

      const listings = [];
      lastLi.querySelectorAll(".embedDescription__623de").forEach((desc) => {
        const regex = /([\d,]+)\s*\[([\d]+)\]・\s*([\w\d]+)/g;
        let match;
        while ((match = regex.exec(desc.innerText)) !== null) {
          listings.push({
            price: match[1].replaceAll(",", ""),
            qty: parseInt(match[2], 10),
            seller: match[3],
          });
        }
      });

      return { name, itemId, listings };
    });

    const data = { snapshotAt, ...listingData };

    console.log("Data extracted:", data);

    const db = await client.db(process.env.DB_NAME);
    await db.collection("listing_snapshots").insertOne(data);

    await browser.close();

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in Discord query:", error);

    if (page) {
      const screenshot = await page.screenshot({
        encoding: "base64",
        fullPage: true,
      });
      console.error(screenshot);

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message + "\n" + screenshot,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
