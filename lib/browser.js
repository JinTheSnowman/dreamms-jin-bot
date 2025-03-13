import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

let browser;

if (process.env.NODE_ENV === "development") {

  browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: true,
    ignoreHTTPSErrors: true,
  });

} else {
  const executablePath = await chromium.executablePath(
    "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
  )

  browser = await puppeteerCore.launch({
    executablePath,
    args: chromium.args,
    defaultViewport: 
    chromium.defaultViewport,
    headless: true,
    ignoreHTTPSErrors: true,
  });
}

export default browser;