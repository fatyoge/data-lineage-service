﻿import * as express from "express";
import config from "../server-config";
import { writersCache } from "../server-global-cache";
import IOTAWriter from "../../cmds/IOTAWriter";
import { IDataPackage } from "../data-package";
import { Logger } from "../../common/logger";

const router = express.Router();
router
    /*
     * Get all packages in the channel
     */
    .post("/",
        async (req, res) => {
            const seed = req.headers["seed"] as string;
            if (typeof seed !== "string") {
                res.status(400).end("missing seed header");
                return;
            }
            if (!req.body) {
                res.status(400).end("missing request body");
                return;
            }
            var newPackage = req.body as IDataPackage;
            if (!newPackage.dataPackageId || !newPackage.wayOfProof || !newPackage.valueOfProof) {
                res.status(400).end("dataPackageId, wayOfProof and valueOfProof are mandatory. The field name is case sensitive.");
                return;
            }

            let writer = writersCache.get(seed) as IOTAWriter;
            if (!writer) {
                Logger.log(`IOTA writer is NOT found from cache for seed: ${seed.substring(0, 5)}..., create one.`);
                writer = new IOTAWriter(config.iotaProviders[0], seed);
                writersCache.set(seed, writer);
            }
            try {
                const reqBody = req.body as IDataPackage;
                delete reqBody.mamAddress;
                delete reqBody.nextRootAddress;
                const attachResult = await writer.attachNew(reqBody);
                if (IOTAWriter.attachFailed(attachResult)) {
                    res.status(400).end(`Failed to publish to the tangle. the error is ${attachResult.error}`);
                } else if (attachResult.address) {
                    reqBody.mamAddress = attachResult.address;
                    reqBody.nextRootAddress = attachResult.nextRoot;
                    res.status(200).json(reqBody).end();
                }
            } catch (e) {
                res.status(500).end(`Failed to publish to the tangle.Error ${e}`);
            }
        });

export default router;