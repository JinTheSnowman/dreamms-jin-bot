// import chromium from "@sparticuz/chromium";
// import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

let browser;

// if (process.env.NODE_ENV === "development") {

//   const install = require(`puppeteer/install.mjs`);
//   await install();

//   const browser = await puppeteer.launch({
//     args: ["--use-gl=angle", "--use-angle=swiftshader", "--single-process", "--no-sandbox"],
//     headless: true,
//   });

// } else {
browser = await puppeteer.launch({
  headless: true,
});
// }

export default browser;