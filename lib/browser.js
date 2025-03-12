import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

const CHROMIUM_ARGS = [
  '--allow-pre-commit-input',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-sync',
  '--enable-automation',
  '--enable-blink-features=IdleDetection',
  '--export-tagged-pdf',
  '--force-color-profile=srgb',
  '--metrics-recording-only',
  '--no-first-run',
  '--password-store=basic',
  '--use-mock-keychain',
  '--disable-domain-reliability',
  '--disable-print-preview',
  '--disable-speech-api',
  '--disk-cache-size=33554432',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-pings',
  '--font-render-hinting=none',
  '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints,AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
  '--enable-features=NetworkServiceInProcess2,SharedArrayBuffer',
  '--hide-scrollbars',
  '--ignore-gpu-blocklist',
  '--in-process-gpu',
  '--window-size=1920,1080',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--allow-running-insecure-content',
  '--disable-setuid-sandbox',
  '--disable-site-isolation-trials',
  '--disable-web-security',
  '--no-sandbox',
  '--no-zygote'
];

let browser;

if (process.env.NODE_ENV === "development") {

  browser = await puppeteer.launch({
    args: CHROMIUM_ARGS,
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
    args: CHROMIUM_ARGS,
    defaultViewport: 
    // chromium.defaultViewport,
    {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 480,
      isLandscape: true,
      isMobile: true,
      width: 320,
    },
    headless: true,
    ignoreHTTPSErrors: true,
  });
}

export default browser;