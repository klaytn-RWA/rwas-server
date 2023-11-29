import * as ethers from "ethers";
import abi from "../abi/TranscaAssetNFT.json";
import lotteryAbi from "../abi/Lottery.json";
require("dotenv").config();

export const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);
// export const wallet = new ethers.Wallet(process.env.ACCOUNT_KEY!, provider);
// export const transcaAssetNFTContract = new ethers.Contract(process.env.TRANSCA_NFT_SMC_ADDRESS!, abi, provider);
// export const transcaLotteryNFTContract = new ethers.Contract(process.env.TRANSCA_LOTTERY_SMC_ADDRESS!, lotteryAbi, provider);

export const wallet = new ethers.Wallet("bdc66a08d8799ff8c520daefb2f12e86a5a884f5645c85b3bd218fffb66b47c5", provider);
export const transcaAssetNFTContract = new ethers.Contract("0xC101C2dbC5a93A7a3a527A1DD4a23C8d9A02DB7f", abi, provider);
export const transcaLotteryNFTContract = new ethers.Contract("0x6224B03b7ee0aDDAFe59C1bCE16e15FfE66364CF", lotteryAbi, provider);

// TRANSCA_NFT_SMC_ADDRESS = "0xC101C2dbC5a93A7a3a527A1DD4a23C8d9A02DB7f";
// TRANSCA_LOTTERY_SMC_ADDRESS = "0x6224B03b7ee0aDDAFe59C1bCE16e15FfE66364CF";
// ACCOUNT_KEY = "bdc66a08d8799ff8c520daefb2f12e86a5a884f5645c85b3bd218fffb66b47c5";

export async function getNonce(wallet) {
  let nonce = await provider.getTransactionCount(wallet.address);
  return nonce;
}
export async function getGasPrice() {
  let feeData = (await provider.getGasPrice()).toNumber();
  return feeData * 2;
}

export async function mintNFT(toAddress, weightParseUnit, expireTime, asset_type, indentifier_code, uri, useDefineBigNumber, appraisalPriceBigNumber) {
  try {
    const nonce = await getNonce(wallet);
    const gasFee = await getGasPrice();
    let rawTxn = await transcaAssetNFTContract.populateTransaction.safeMint(toAddress, weightParseUnit, expireTime, asset_type, indentifier_code, uri, useDefineBigNumber, appraisalPriceBigNumber, {
      gasPrice: gasFee,
      nonce: nonce,
    });
    console.log("7s200:Gas price", ethers.utils.formatUnits(gasFee, "gwei"), " - & nonce:", nonce);
    let signedTxn = (await wallet).sendTransaction(rawTxn);
    let reciept = await (await signedTxn).wait();
    console.log("7s200:Reciept", reciept);
    if (reciept) {
      return reciept;
    } else {
      return null;
    }
  } catch (e) {
    console.log("7s200:err", e);
    return null;
  }
}
