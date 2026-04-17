import http from "node:http";

const URL = "http://127.0.0.1:8545";
const RETRIES = 30;
const DELAY_MS = 1000;

function checkNode() {
  return new Promise((resolve, reject) => {
    const req = http.get(URL, (res) => {
      res.destroy();
      resolve(true);
    });

    req.on("error", () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForNode() {
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const ready = await checkNode();

    if (ready) {
      console.log(`Hardhat node available at ${URL}`);
      process.exit(0);
    }

    console.log(`Waiting for Hardhat node (${attempt}/${RETRIES})...`);
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  console.error(`Hardhat node did not become ready after ${RETRIES} seconds.`);
  process.exit(1);
}

waitForNode();
