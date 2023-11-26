import Koa from "koa";
import koaLogger from "koa-pino-logger";
import Router from "@koa/router";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import logger from "./utils/log";
import { PinataUpload } from "./services/pinata";
import { getGasPrice, getNonce, mintNFT, transcaLotteryNFTContract, wallet } from "./services/ether";
import * as ethers from "ethers";
import { corsMiddleware } from "./middleware/cors";
import { randomString } from "./utils/random";
import cron from "node-cron";
(async function main() {
  const app = new Koa();

  //   app.use(cacheMiddleware);
  // app.use(koaLogger());
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  app.use(corsMiddleware);
  app.use(bodyParser());

  // app router
  const router = new Router({ prefix: "/v1" });

  type MintReq = {
    to: string;
    asset_type: number;
    weight: number;
    indentifier_code: string;
    user_define_price: number | null;
    appraisal_price: number | null;
  };
  const NFTImgae = {
    GOLD1: "https://ipfs.io/ipfs/QmTgB4FKXCST95F8f7qtK6mFVZ5Q3tYPHdJR68rSkByaWA", //3 ounce
    GOLD2: "https://ipfs.io/ipfs/QmTCRf3NFJWFDxXJds8efqbW4Xn7Vhy1Q4TpTNPbkcdrY6", //5 ounce
    GOLD3: "https://ipfs.io/ipfs/QmXiYvoxPD1jNNuADR6duUoF8tszLxqUBVPyBLVRUFKsch", //6 ounce
    DIAMOND1: "https://ipfs.io/ipfs/QmRYkXnQSvyKVJ9iDJ27a8KfwKny88mpZ6WyNeHQJC6qje", //1 karat
    DIAMOND2: "https://ipfs.io/ipfs/QmaW2mCroyKNTRyeDY756ok7DGLwSaL74J8vsrK81dwnLM", //2 karat
    DIAMOND3: "https://ipfs.io/ipfs/QmcSAy453xaAd8m4juyBovNHSRikHmqBBZoWWRM7GLqDcg", //3 karat
    MONKEY1: "https://ipfs.io/ipfs/QmTM6pgQRbdJ7kfk1UYQDJE6g95Z2pc7g1Sb5rE1GY4JdN",
    MONKEY2: "https://ipfs.io/ipfs/QmPD8TnpnQVEUWJy7toL7JCt788MCHMX93TDnSorjkk4Ff",
    MONKEY3: "https://ipfs.io/ipfs/QmNkunyAS8wGL8kaWwtsW425LbQKsMmH2115buepqZSzUx",
    PATEK1: "https://ipfs.io/ipfs/QmZubLimKhbPASKqXaq3KEvqg5bYXbiWxUSvZ6992NyboP",
    AP1: "https://ipfs.io/ipfs/QmVSurVqeMZybg38wV5U3nEtMgPH8q6bKKENE1mqTvobgH",
    AP2: "https://ipfs.io/ipfs/QmV8dnFqUZrQGzMjA5FhoUM8Gnid7vD3pfAhzSwFcKtCaR",
  };

  router.post("/mint", async (ctx) => {
    const { to, weight, asset_type, indentifier_code, user_define_price, appraisal_price } = ctx.request.body as MintReq;
    try {
      ctx.body = ctx.request.body;
      const toAddress = ethers.utils.getAddress(to);
      const startTime = new Date().valueOf();
      const expireTime = startTime + 100000000;
      const weightParseUnit = ethers.utils.parseUnits(weight.toString(), 10);
      const useDefineBigNumber = ethers.BigNumber.from(user_define_price ? user_define_price : 0);
      const appraisalPriceBigNumber = ethers.BigNumber.from(appraisal_price ? appraisal_price : 0);
      const indentifierCode = indentifier_code + randomString();

      const attributes = [
        {
          trait_type: "assetType",
          value: asset_type,
        },
        {
          trait_type: "weight",
          value: weightParseUnit,
        },
        {
          trait_type: "indentifierCode",
          value: indentifierCode,
        },
        {
          trait_type: "userDefinePrice",
          value: useDefineBigNumber,
        },
        {
          trait_type: "appraisalPrice",
          value: appraisalPriceBigNumber,
        },
      ];

      let img = "";
      // GOLD
      if (asset_type === 0) {
        if (weight > 0 && weight < 5) {
          img = NFTImgae.GOLD1;
        }
        if (weight >= 5 && weight < 6) {
          img = NFTImgae.GOLD2;
        }
        if (weight >= 6) {
          img = NFTImgae.GOLD3;
        }
      }
      // DIAMOND
      if (asset_type === 1) {
        if (weight > 0 && weight <= 1) {
          img = NFTImgae.DIAMOND1;
        }
        if (weight > 1 && weight <= 2) {
          img = NFTImgae.DIAMOND2;
        }
        if (weight > 2 && weight <= 3) {
          img = NFTImgae.DIAMOND3;
        }
      }
      // OTHER
      if (asset_type === 2) {
        const indetifierPrefix = indentifier_code.split("-")[0];
        if (indetifierPrefix === "PATEK1") {
          img = NFTImgae.PATEK1;
        }
        if (indetifierPrefix === "AP1") {
          img = NFTImgae.AP1;
        }
        if (indetifierPrefix === "AP2") {
          img = NFTImgae.AP2;
        }
        if (indetifierPrefix === "MONKEY1") {
          img = NFTImgae.MONKEY1;
        }
        if (indetifierPrefix === "MONKEY2") {
          img = NFTImgae.MONKEY2;
        }
        if (indetifierPrefix === "MONKEY3") {
          img = NFTImgae.MONKEY3;
        }
      }

      // Upload to pinata
      const upload = await PinataUpload(img, attributes);
      if (!upload.IpfsHash) {
        ctx.body = {
          status: 400,
          message: upload,
        };
        return;
      }

      // Mint NFT
      const mintReceipt = await mintNFT(toAddress, weightParseUnit, expireTime, asset_type, indentifierCode, `https://ipfs.io/ipfs/${upload.IpfsHash}`, useDefineBigNumber, appraisalPriceBigNumber);

      if (!mintReceipt) {
        ctx.body = {
          status: 400,
          message: mintReceipt,
        };
        return;
      }

      ctx.body = {
        ipfs_hash: `https://ipfs.io/ipfs/${upload.IpfsHash}`,
        reciept: mintReceipt,
      };
    } catch (error) {
      ctx.body = error;
    }
  });

  router.get("/live-api", (ctx) => {
    ctx.body = "Hello World 3";
  });

  router.post("/create-mint-request", async (ctx) => {
    const { to, weight, asset_type, indentifier_code, user_define_price, appraisal_price } = ctx.request.body as MintReq;
    try {
      ctx.body = ctx.request.body;
      const startTime = new Date().valueOf();
      const expireTime = startTime + 100000000;
      const weightParseUnit = ethers.utils.parseUnits(weight.toString(), 10);
      const useDefineBigNumber = ethers.BigNumber.from(user_define_price ? user_define_price : 0);
      const appraisalPriceBigNumber = ethers.BigNumber.from(appraisal_price ? appraisal_price : 0);
      const indentifierCode = indentifier_code + randomString();
      const attributes = [
        {
          trait_type: "assetType",
          value: asset_type,
        },
        {
          trait_type: "weight",
          value: weightParseUnit,
        },
        {
          trait_type: "indentifierCode",
          value: indentifierCode,
        },
        {
          trait_type: "userDefinePrice",
          value: useDefineBigNumber,
        },
        {
          trait_type: "appraisalPrice",
          value: appraisalPriceBigNumber,
        },
      ];
      let img = "";
      // GOLD
      if (asset_type === 0) {
        if (weight > 0 && weight < 5) {
          img = NFTImgae.GOLD1;
        }
        if (weight >= 5 && weight < 6) {
          img = NFTImgae.GOLD2;
        }
        if (weight >= 6) {
          img = NFTImgae.GOLD3;
        }
      }
      // DIAMOND
      if (asset_type === 1) {
        if (weight > 0 && weight <= 1) {
          img = NFTImgae.DIAMOND1;
        }
        if (weight > 1 && weight <= 2) {
          img = NFTImgae.DIAMOND2;
        }
        if (weight > 2 && weight <= 3) {
          img = NFTImgae.DIAMOND3;
        }
      }
      // OTHER
      if (asset_type === 2) {
        const indetifierPrefix = indentifier_code.split("-")[0];
        if (indetifierPrefix === "PATEK1") {
          img = NFTImgae.PATEK1;
        }
        if (indetifierPrefix === "AP1") {
          img = NFTImgae.AP1;
        }
        if (indetifierPrefix === "AP2") {
          img = NFTImgae.AP2;
        }
        if (indetifierPrefix === "MONKEY1") {
          img = NFTImgae.MONKEY1;
        }
        if (indetifierPrefix === "MONKEY2") {
          img = NFTImgae.MONKEY2;
        }
        if (indetifierPrefix === "MONKEY3") {
          img = NFTImgae.MONKEY3;
        }
      }

      // Upload to pinata
      const upload = await PinataUpload(img, attributes);
      if (!upload.IpfsHash) {
        ctx.body = {
          status: 400,
          message: upload,
        };
        return;
      }
      ctx.body = {
        ipfs_hash: `https://ipfs.io/ipfs/${upload.IpfsHash}`,
        to,
        weight,
        asset_type,
        indentifier_code,
        user_define_price,
        appraisal_price,
        expireTime,
        img: img,
      };
    } catch (error) {
      ctx.body = error;
    }
  });

  router.post("/create-lottery", async (ctx) => {
    const { assetId, duration } = ctx.request.body as any;
    const nonce = await getNonce(wallet);
    console.log("7s200:none", wallet.address);
    const gasFee = await getGasPrice();
    let rawTxn = await transcaLotteryNFTContract.populateTransaction.createLottery(assetId, duration);
    console.log("7s200:rwa", rawTxn);

    let signedTxn = await (await wallet).sendTransaction(rawTxn);
    console.log("7s200:sugb", signedTxn);

    let reciept = await (await signedTxn).wait();
    console.log("7s200:receipt", reciept);

    if (reciept) {
      ctx.body = {
        data: reciept,
        error: null,
      };
    } else {
      ctx.body = {
        error: true,
      };
    }
  });

  cron.schedule("*/5 * * * * *", async function () {
    let lottery = await transcaLotteryNFTContract.getCurrentLottery();
    const time = Date.now();

    if (lottery.winner !== "0x0000000000000000000000000000000000000000" && Number(lottery.winNumber) !== 0) {
      return;
    }
    // console.log("7s200:lottery", Number(lottery.id), Number(lottery.winNumber));
    if (Number(lottery.expiredAt) < time / 1000) {
      const nonce = await getNonce(wallet);
      const gasFee = await getGasPrice();
      let rawTxn = await transcaLotteryNFTContract.populateTransaction.updateWinNumber(Math.floor(Math.random() * 5), Number(lottery.id), {
        gasPrice: gasFee,
        nonce: nonce,
      });
      let signedTxn = await (await wallet).sendTransaction(rawTxn);
      let reciept = await (await signedTxn).wait();
      console.log("7s200:", Number(lottery.id), reciept);
      return reciept;
    }
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = process.env.PORT || 3000;

  app.listen(port);
  // logger.info({ thread: "main", data: "service started", port });
})();
