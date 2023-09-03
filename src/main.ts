import Koa from "koa";
import koaLogger from "koa-pino-logger";
import Router from "@koa/router";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import logger from "./utils/log";
import { PinataUpload } from "./services/pinata";
import { mintNFT, transcaAssetNFTContract, wallet } from "./services/ether";
import * as ethers from "ethers";

(async function main() {
  const app = new Koa();

  //   app.use(cacheMiddleware);
  app.use(koaLogger());
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  //   app.use(corsMiddleware);
  app.use(bodyParser());

  // app router
  const router = new Router({ prefix: "/v1" });

  router.get("/", async (ctx) => {
    // const res = await PinataUpload();
    ctx.body = "res";
  });
  type MintReq = {
    to: string;
    name: string;
    asset_type: number;
    weight: number;
    indentifier_code: string;
    user_define_price: number | null;
    appraisal_price: number | null;
  };
  router.post("/mint", async (ctx) => {
    const { to, name, weight, asset_type, indentifier_code, user_define_price, appraisal_price } = ctx.request.body as MintReq;
    try {
      ctx.body = ctx.request.body;
      const toAddress = ethers.utils.getAddress(to);
      const startTime = new Date().valueOf();
      const expireTime = startTime + 100000000;
      const weightParseUnit = ethers.utils.parseUnits(weight.toString(), "ether");
      const useDefineBigNumber = ethers.BigNumber.from(user_define_price ? user_define_price : 0);
      const appraisalPriceBigNumber = ethers.BigNumber.from(appraisal_price ? appraisal_price : 0);
      const attributes = [
        {
          trait_type: "name",
          value: name,
        },
        {
          trait_type: "weight",
          value: weightParseUnit,
        },
        {
          trait_type: "indentifier_code",
          value: indentifier_code,
        },
        {
          trait_type: "user_define_price",
          value: useDefineBigNumber,
        },
        {
          trait_type: "appraisal_price",
          value: appraisalPriceBigNumber,
        },
      ];

      // Upload to pinata
      const upload = await PinataUpload(attributes);
      if (!upload.IpfsHash) {
        ctx.body = {
          status: 400,
          message: "Upload to Pinata failed!",
        };
        return;
      }

      // Mint NFT
      const mintReceipt = await mintNFT(toAddress, weightParseUnit, expireTime, asset_type, indentifier_code, upload.IpfsHash, useDefineBigNumber, appraisalPriceBigNumber);

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

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = 3333;

  app.listen(port);
  logger.info({ thread: "main", data: "service started", port });
})();
