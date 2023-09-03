import Koa from "koa";
import koaLogger from "koa-pino-logger";
import Router from "@koa/router";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import logger from "./utils/log";
import { PinataUpload } from "./services/pinata";

(async function main() {
  const app = new Koa();

  //   app.use(cacheMiddleware);
  app.use(koaLogger());
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  //   app.use(corsMiddleware);
  app.use(bodyParser());

  //   await client.connect();
  //   client.on("close", () => {
  //     client.connect();
  //   });

  //   await nftCollInit();

  // app router
  const router = new Router({ prefix: "/v1" });

  router.get("/", async (ctx) => {
    // const res = await PinataUpload();
    ctx.body = "res";
  });
  type MintReq = {
    name: string;
    weight: number;
    indentifier_code: string;
    user_define_price: number | null;
    appraisal_price: number | null;
  };
  router.post("/mint", async (ctx) => {
    const { name, weight, indentifier_code, user_define_price, appraisal_price } = ctx.request.body as MintReq;
    try {
      ctx.body = ctx.request.body;
      const attributes = [
        {
          trait_type: "name",
          value: name,
        },

        {
          trait_type: "weight",
          value: weight,
        },
        {
          trait_type: "indentifier_code",
          value: indentifier_code,
        },
        {
          trait_type: "user_define_price",
          value: user_define_price,
        },
        {
          trait_type: "appraisal_price",
          value: appraisal_price,
        },
      ];
      const upload = await PinataUpload(attributes);
      ctx.body = {
        ipfs_hash: `https://ipfs.io/ipfs/${upload.IpfsHash}`,
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
