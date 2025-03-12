import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

let browser;

if (process.env.NODE_ENV === "development") {
  browser = await puppeteer.launch({
    headless: true,
  });

} else {
  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
  )

  browser = puppeteerCore.launch({
    executablePath,
    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

export default browser;