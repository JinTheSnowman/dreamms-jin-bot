import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

export const dynamic = "force-dynamic";

const remoteExecutablePath =
  "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar";

let browser;

if (process.env.NODE_ENV === "production") {
  browser = await puppeteerCore.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(remoteExecutablePath),
    headless: true,
  });
} else {
  browser = await puppeteer.launch({
    headless: true,
  });
}

export default browser;