const { BigNumber, utils, Wallet, ethers } = require("ethers");
import User from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const signerKey: string | undefined = process.env.SIGNER_KEY;
const forgeAmounts = [
  ethers.utils.parseEther("1"), // Day 1
  ethers.utils.parseEther("2"), // Day 2
  ethers.utils.parseEther("3"), // Day 3
  ethers.utils.parseEther("4"), // Day 4
  ethers.utils.parseEther("7"), // Day 5
  ethers.utils.parseEther("10"), // Day 6
  ethers.utils.parseEther("15"), // Day 7
];

if (!signerKey) {
  throw new Error("SIGNER_KEY is not defined in the environment variables.");
}

interface SignCheckInResult {
  signature: string;
  nonce: string;
}

interface StreakData {
  address: string;
  isEligibleForMint: boolean;
  signature?: string;
  nonce?: string;
}

const signCheckIn = async (
  userAddress: string,
  amount: BigInt,
  signing_key: string
): Promise<SignCheckInResult> => {
  const wallet = new Wallet(signing_key);
  const nonce = ethers.utils.randomBytes(32);
  let msgHash: string;

  msgHash = ethers.utils.solidityKeccak256(
    ["address", "bytes", "uint256"],
    [userAddress, nonce, BigNumber.from(amount).toHexString()]
  );

  const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));

  return {
    signature: signature,
    nonce: utils.hexlify(nonce),
  };
};

const getForgeAmount = (streak: number): typeof BigNumber => {
  // Use streak - 1 as arrays are 0-indexed
  return streak <= forgeAmounts.length
    ? forgeAmounts[streak - 1]
    : BigNumber.from(0);
};

export const getSignature = async (req: any, res: any): Promise<void> => {
  const reqBody = req.body;
  if (!reqBody) {
    return res.json({ success: false, error: "No request body" });
  }
  let userAddress = reqBody.address;
  try {
    const user = await User.findOne({ walletAddress: userAddress });
    if (!user) {
      return res.json({ success: false, error: "User not found" });
    }
    // Reset user streak if last check-in was more than 24 hours ago
    const lastCheckIn = new Date(user.lastCheckIn);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - lastCheckIn.getTime());
    const diffHours = Math.ceil(timeDiff / (1000 * 60 * 60));
    if (diffHours >= 24) {
      user.streak = 1;
    }
    // Get forge amount
    const amount = getForgeAmount(user.streak);
    let { signature, nonce } = await signCheckIn(
      userAddress,
      amount,
      signerKey!
    );
    // Return a streak response
    return res.json({
      success: true,
      data: {
        address: userAddress,
        isEligibleForMint: true,
        amount: amount.toString(),
        signature: signature,
        nonce: nonce,
      },
    });
  } catch (error) {
    return res.json({ success: false, error: error });
  }
};
