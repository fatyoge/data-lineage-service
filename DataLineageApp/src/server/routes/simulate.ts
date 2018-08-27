import express = require("express");
import uuid = require("uuid/v4");
import crypto = require("crypto");
import IOTAWriter from "../../cmds/IOTAWriter";
import serverConfig from "../server-config";
import { IDataPackage, PacakgeHelper } from "../data-package";
import { writersCache } from "../server-global-cache";
const routerUI = express.Router();
const routerApi = express.Router();

/* GET simulate UI. */
routerUI.get("/publisher", (req, res) => {
    res.render("simulate-publisher", { title: "Publish data integrity information" });
});

routerUI.get("/processor", (req, res) => {
    res.render("simulate-processor", { title: "Publish data lineage information" });
});

interface IPackageSubmitData {
    inputs?: string[];
    wayofProof: string;
    value;
    dataPackageId?: string;
}

async function writeData(seed: string, data: IPackageSubmitData): Promise<IDataPackage | string> {
    let writer = writersCache.get(seed) as IOTAWriter;
    if (!writer) {
        console.log(`iota writer is found from cache for seed ${seed}`);
        writer = new IOTAWriter(serverConfig.iotaProviders[0], seed);
        writersCache.set(seed, writer);
    }
    if (!data.wayofProof) {
        const error = "package data missing required field 'wayofProof'"
        console.error(error);
        return error;
    }
    const pkg: IDataPackage = {
        ...data as any,
        timestamp: Date.now(),
        dataPackageId: data.dataPackageId ? data.dataPackageId : uuid(),
        inputs: data.inputs ? data.inputs : []
    } as any;
    //value is added by ...data
    delete (pkg as any).value;
    switch (pkg.wayofProof.toLowerCase()) {
    case PacakgeHelper.PROOF_STANDARD:
        pkg.valueOfProof =
            crypto.createHash("sha256")
            .update(`${pkg.dataPackageId} ${data.value} ${pkg.timestamp}`)
            .digest("hex");
        break;
    case PacakgeHelper.PROOF_VALUE:
        pkg.valueOfProof = data.value;
        break;
    default:
        return `unknown wayofProof ${pkg.wayofProof}`;
    }
    delete pkg.mamAddress;
    delete pkg.nextRootAddress;
    try {
        const attachResult = await writer.attachNew(pkg);
        if (attachResult) {
            pkg.mamAddress = attachResult.address;
            pkg.nextRootAddress = attachResult.nextRoot;
        }
    } catch (e) {
        const error = `failed to attach the pacakge ${JSON.stringify(pkg)} with seed ${seed}, the exception is ${e}`;
        console.error(error);
        return error;
    }
    
    if (!pkg.mamAddress) {
        const error = `failed to attach the pacakge ${JSON.stringify(pkg)} with seed ${seed}`;
        console.error(error);
        return error;
    }
    
    return pkg;
}

/**
 * api for add package
 */
routerApi.post("/",
    async (req, res) => {
        const seed = req.headers["seed"] as string;
        if (typeof seed !== "string") {
            res.end(400);
            return;
        }
        const result = await writeData(seed, req.body);
        if (typeof result === "string") {
            res.status(500).end(result);
        }
        res.json(result);
    });

export {routerUI, routerApi};
