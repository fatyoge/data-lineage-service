import * as express from "express";
import config from "../server-config";
import { writersCache } from "../server-global-cache";
import IOTAWriter from "../../cmds/IOTAWriter";
import { IDataPackage } from "../data-package";

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
            let writer = writersCache.get(seed) as IOTAWriter;
            if (!writer) {
                console.log(`iota writer is found from cache for seed ${seed}`);
                writer = new IOTAWriter(config.iotaProviders[0], seed);
                writersCache.set(seed, writer);
            }
            try {
                const result = await writer.attachNew(req.body as IDataPackage);
                if (typeof result === "undefined") {
                    res.status(500).end(`push to block chain failed`);
                } else if (result.address) {
                    res.status(200).end(result.address);
                }
            } catch (e) {
                res.status(500).end(`push to block chain failed with error ${e}`);
            }
        });

export default router;