const puppeteer = require('puppeteer');
const speedline = require('speedline');

const PAGE_TO_MEASURE = 'https://zapier.com/';

const NETWORK_CONDITIONS = {
  offline: false,
  // Simulated download speed (bytes/s)
  downloadThroughput: 256 * 1024,
  // Simulated upload speed (bytes/s)
  uploadThroughput: 256 * 1024,
  // Simulated latency (ms)
  latency: 20,
};

function displayPretty(res) {
  const OUTPUT_GREEN = '\x1b[32m';
  const OUTPUT_BOLD = '\x1b[1m';
  const OUTPUT_RESET = '\x1b[22m\x1b[39m';
  const green = content => OUTPUT_GREEN + content + OUTPUT_RESET;
  const bold = content => OUTPUT_BOLD + content + OUTPUT_RESET;

  console.log(
    [
      `${bold('Recording duration')}: ${green(res.duration + ' ms')}  (${res
        .frames.length} frames found)`,
      `${bold('First visual change')}: ${green(res.first + ' ms')}`,
      `${bold('Last visual change')}: ${green(res.complete + ' ms')}`,
      `${bold('Speed Index')}: ${green(res.speedIndex.toFixed(1))}`,
      `${bold('Perceptual Speed Index')}: ${green(
        res.perceptualSpeedIndex.toFixed(1)
      )}`,
    ].join('\n')
  );
}

const config = (async () => {
  let browser;

  try {
    // start the browser
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // connect to devtools and set network shaping
    const devtools = await page.target().createCDPSession();
    await devtools.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS);

    // start trace
    const traceName = new Date().toISOString();
    const tracePath = `traces/${traceName}.json`;
    await page.tracing.start({ path: tracePath, screenshots: true });

    // navigate to page and collect trace
    await page.goto(PAGE_TO_MEASURE);
    await page.tracing.stop();

    const results = await speedline(tracePath);
    displayPretty(results);
    // console.log(results);
  } catch (e) {
    throw e;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
