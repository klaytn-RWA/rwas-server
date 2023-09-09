import * as ethers from "ethers";
import abi from "../abi/TranscaAssetNFT.json";

export const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);
export const wallet = new ethers.Wallet(process.env.ACCOUNT_KEY!, provider);
export const transcaAssetNFTContract = new ethers.Contract(process.env.TRANSCA_NFT_SMC_ADDRESS!, abi, provider);

export async function getNonce(wallet) {
  let nonce = await provider.getTransactionCount(wallet.address);
  return nonce;
}
export async function getGasPrice() {
  let feeData = (await provider.getGasPrice()).toNumber();
  return feeData;
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
