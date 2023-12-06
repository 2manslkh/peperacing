import ethers from "ethers";

const isUser = async (
  userAddress: string,
  signature: string
): Promise<boolean> => {
  const recoveredAddress = ethers.utils.verifyMessage(signature, userAddress);
  return recoveredAddress.toLowerCase() === userAddress.toLowerCase();
};

export { isUser };
