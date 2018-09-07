import * as express from "express";
import config from "../server-config";
import { IDataPackage } from "../data-package";
import IOTAReader from "../../cmds/IOTAReader";
import { Logger } from "../../common/logger";

const router = express.Router();

/**
 * wait until one promise resolved or all promise rejected
 * @param promises
 */
function waitAny<T>(promises: Promise<T>[]): Promise<T> {
    const promiseOp: {
        resolve: (value?: any) => void;
        reject: (reason?: any) => void;
    } = {} as any;
    const result = new Promise<T>((resolve, reject) => {
        promiseOp.resolve = resolve;
        promiseOp.reject = reject;
    });
    if (!promises || promises.length <= 0) {
        promiseOp.resolve(null);
        return result;
    }
    let resolved = false;
    let finishedPromisesCount = 0;
    promises.forEach(p => {
        p
            .then(value => {
                finishedPromisesCount++;
                if (!resolved && value) {
                    Logger.log(`waitAny function get one promise resolved for the first time, value is ${JSON.stringify(value)}`);
                    promiseOp.resolve(value);
                    resolved = true;
                } else if (!resolved && finishedPromisesCount >= promises.length) {
                    Logger.log(`waitAny function all are finished, but none return a value, so return null instead`);
                    promiseOp.resolve(null);
                    resolved = true;
                }
            })
            .catch(reason => {
                Logger.error(`waitAny function get one promise failed with reason ${JSON.stringify(reason)}`);
                //ToDo: Log the reason
                finishedPromisesCount++;
                if (!resolved && finishedPromisesCount >= promises.length) {
                    promiseOp.reject(reason);
                }
            });
    });
    return result;
}


async function fetchPackageInfoWithCache(address: string): Promise<IDataPackage | null> {
    if (!address) {
        return null;
    }

    for (let i = 0; i < config.iotaProviders.length; i++) {
        const reader = new IOTAReader(config.iotaProviders[i]);
        try {
            const firstFound = await reader.fetchPackageInfo(address, true);
            if (firstFound) return firstFound;
        } catch (e) {
            Logger.error(`Fetch package of address '${address}' failed with error ${JSON.stringify(e)} from ${config.iotaProviders[i]}`);
        }
    }

    return null;
}


router
/*
 * Get all packages in the channel
 */
    .get("/channel/:rootAddress", async (req, res) => {
        const allPacakges: IDataPackage[] = [];
        let rootAddress = req.params["rootAddress"];
        if (!rootAddress) {
            res.end(400);
            return;
        }
        while (true) {
            let pkg = await fetchPackageInfoWithCache(rootAddress);
            if (!pkg) {
                break;
            }
            rootAddress = pkg.nextRootAddress;
            allPacakges.push(pkg);
            if (!rootAddress) {
                break;
            }
        }
        if (allPacakges.length <= 0) {
            res.status(404).end(`Can't find any packages with the address ${rootAddress}`);
            return;
        }
        res.json(allPacakges);
    })
 /* GET package information by address api
 supported urls:
 api/address/OAZUEUIFHISXGUFCBBRTJBRLIJJEJFFEIVSFHPNQRRHIXXKUCXVQNDIVXVNOICUWLLYEZVADHHULIEOFY         -> only get this pacakge inforamtion
 api/address/OAZUEUIFHISXGUFCBBRTJBRLIJJEJFFEIVSFHPNQRRHIXXKUCXVQNDIVXVNOICUWLLYEZVADHHULIEOFY/all     -> get pcakge and all it's inputs recursively
 */
    .get("/:address/:all?", async (req, res) => {
        const allPacakges: IDataPackage[] = [];
        const fetchAddresses: string[] = [];
        let address = req.params["address"];
        if (address) {
            fetchAddresses.push(address);
        }
        while (fetchAddresses.length > 0) {
            address = fetchAddresses.shift();
            let pkg = await fetchPackageInfoWithCache(address);
            if (pkg) {
                allPacakges.push(pkg);
                if (req.params.all && pkg.inputs && pkg.inputs.length > 0) {
                    pkg.inputs.forEach(a => fetchAddresses.push(a));
                }
            }
        }
        if (allPacakges.length <= 0) {
            res.status(404).end(`Can't find any packages with the address ${fetchAddresses}`);
            return;
        }
        res.json(allPacakges);
    });

export default router;