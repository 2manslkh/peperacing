const whitelist = require("../data/whitelist.json");
const { ethers, BigNumber } = require("ethers");

require("dotenv").config();

const AKIVERSE_SIGNER_KEY = process.env.SIGNER_KEY;

const signWhitelistAkiverse = async (user, stage, amount, signing_key) => {
  const wallet = new ethers.Wallet(signing_key);
  const nonce = ethers.utils.randomBytes(32);
  let msgHash;
  if (stage === 10) {
    msgHash = ethers.utils.solidityKeccak256(
      ["address", "bytes", "uint8", "uint256"],
      [
        user,
        nonce,
        BigNumber.from(stage).toHexString(),
        BigNumber.from(amount).toHexString(),
      ]
    );
  } else {
    msgHash = ethers.utils.solidityKeccak256(
      ["address", "bytes", "uint8"],
      [user, nonce, BigNumber.from(stage).toHexString()]
    );
  }

  const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));
  return { signature: signature, nonce: ethers.utils.hexlify(nonce) };
};

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
    let data = JSON.parse(JSON.stringify(whitelist));
    let phase;
    if (stage === 10) {
      phase = "freeMint";
    } else if (stage === 1) {
      phase = "phase1";
    } else if (stage === 3) {
      phase = "phase2";
    } else {
      return res.status(400).json({
        success: false,
        data: "Invalid Stage",
      });
    }
    // Check if user is whitelisted in previous phase
    if (phase == "phase2") {
      isWhitelisted = data["phase1"].addresses.includes(address);
      if (!isWhitelisted) {
        isWhitelisted = data["phase2"].addresses.includes(address);
      }
    } else {
      isWhitelisted = data[phase].addresses.includes(address);
    }
    if (isWhitelisted && stage !== 10) {
      let { signature, nonce } = await signWhitelist(
        address,
        stage,
        0,
        AKIVERSE_SIGNER_KEY
      );
      return res.status(200).json({
        success: true,
        data: {
          address: address,
          isWhitelisted: true,
          signature: signature,
          nonce: nonce,
          stage: stage,
        },
      });
    } else if (isWhitelisted && stage === 10) {
      let index = data[phase].addresses.indexOf(address);
      let amount = data[phase].amounts[index];
      let { signature, nonce } = await signWhitelist(
        address,
        stage,
        amount,
        AKIVERSE_SIGNER_KEY
      );
      return res.status(200).json({
        success: true,
        data: {
          address: address,
          signature: signature,
          nonce: nonce,
          freeMint: true,
          amount: amount,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        data: {
          address: address,
          isWhitelisted: false,
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
