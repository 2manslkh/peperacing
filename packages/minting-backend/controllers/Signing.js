const { ethers, BigNumber } = require("ethers");
const { auth } = require("google-auth-library");
require("dotenv").config();

const SIGNER_KEY = process.env.SIGNER_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const tabName = "Whitelist";
const range = "A:B";
const keys = JSON.parse(process.env.CREDS);

async function _readGoogleSheet(client, sheetId, tabName, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!${range}`;
  const res = await client.request({ url });
  return res.data["values"];
}

const signWhitelist = async (user, stage, signing_key) => {
  const wallet = new ethers.Wallet(signing_key);
  const nonce = ethers.utils.randomBytes(32);
  let msgHash;

  msgHash = ethers.utils.solidityKeccak256(
    ["address", "bytes", "uint8"],
    [user, nonce, BigNumber.from(stage).toHexString()]
  );

  const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));
  return { signature: signature, nonce: ethers.utils.hexlify(nonce) };
};
function associateNumbers(data) {
  const map = {};

  for (let [address, number] of data) {
    // Check if address is valid
    if (!ethers.utils.isAddress(address)) {
      continue;
    }
    // Convert address to lower case
    address = address.toLowerCase();

    if (!map[address]) {
      map[address] = new Set();
    }
    map[address].add(number);
  }

  return map;
}
function getWhitelistedStagesForAddress(dataMap, address) {
  return dataMap[address] ? Array.from(dataMap[address]) : [];
}
exports.getWhitelistSignature = async (req, res) => {
  let address;
  let stage;
  let isWhitelisted;
  try {
    console.log(req.body.address);
    address = ethers.utils.getAddress(req.body.address);
    // To lower
    address = address.toLowerCase();
    stage = Number(req.body.stage);
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: "Invalid Address",
    });
  }

  try {
    // Generating google sheet client
    const client = auth.fromJSON(keys);
    client.scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    // Reading Google Sheet from a specific range
    const data = await _readGoogleSheet(client, SPREADSHEET_ID, tabName, range);
    // Remove first row (header)
    data.shift();
    // Check if address is whitelisted
    const dataMap = associateNumbers(data);
    const stages = getWhitelistedStagesForAddress(dataMap, address);
    // If stages is empty, address is not whitelisted
    if (stages.length === 0 || !stages.includes(stage.toString())) {
      isWhitelisted = false;
      return res.status(200).json({
        data: {
          address: address,
          isWhitelisted: false,
        },
      });
    } else {
      isWhitelisted = true;
      let { signature, nonce } = await signWhitelist(
        address,
        stage,
        SIGNER_KEY
      );
      return res.status(200).json({
        data: {
          address: address,
          isWhitelisted: true,
          signature: signature,
          nonce: nonce,
          stage: stages,
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Server error",
    });
  }
};
