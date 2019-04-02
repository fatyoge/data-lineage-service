import { IDataPackage } from "../server/data-package";
import { packageCache } from "../server/server-global-cache";
//import IOTA = require("iota.lib.js");
const Mam = require("@iota/mam/lib/mam.client.js");
const { trytesToAscii } = require("@iota/converter");
import { Logger } from "../common/logger";

interface IIOTAFetchResult {
    json: string;
    nextRootAddress: string;
}

export default class IOTAReader {
    constructor(private readonly _iotaProvider: string) {}

    private async fetchMam(address: string): Promise<IIOTAFetchResult | null> {
        Logger.log(`trying to fetch package of address '${address}' from provider ${this._iotaProvider}`);
        //const iota = new IOTA({ provider: this._iotaProvider });
        const mamState = Mam.init(this._iotaProvider);

        /*const fetchedData: any[] = [];
        const msg = await Mam.fetch(address, "public", null, (data:any, a2, a3, a4) => {
            fetchedData.push(data);
            if (a2 && a3 && a4) {
                Logger.log("ok");
            }
        });*/
        const mamResult: { payload: string, nextRoot: string } = await Mam.fetchSingle(address, "public", null);
        if (!mamResult) {
            Logger.error(`Package of address '${address}' returned undefined result from provider ${this._iotaProvider}`);
            return null;
        }
        Logger.log(`Package of address '${address}' is fetched from provider ${this._iotaProvider}`);
        return {
            json: trytesToAscii(mamResult.payload),
            nextRootAddress: mamResult.nextRoot
        };
    }

    async fetchPackageInfo(address: string, useCache: boolean = true): Promise<IDataPackage | null> {
        if (!address) {
            return null;
        }

        if (useCache) {
            const cached = packageCache.get(address);
            //for old cache, there is no nextRootAddress, so we need to check this and update them
            if (cached && cached.nextRootAddress) {
                Logger.log(`Package of address '${address}' is found from cache, just return it`);
                return cached;
            }
        }

        let firstFound: IIOTAFetchResult | null = null;
        try {
            firstFound = await this.fetchMam(address);
        } catch (e) {
            Logger.error(`Fetch package of address '${address}' failed with error ${JSON.stringify(e)} from ${this._iotaProvider}`);
        }

        try {
            if (firstFound) {
                Logger.log(`package of address ${address} is fetched from this provider ${this._iotaProvider}`);
                const found: IDataPackage = {
                    ...JSON.parse(firstFound.json),
                    mamAddress: address,
                    nextRootAddress: firstFound.nextRootAddress
                } as IDataPackage;
                packageCache.set(address, found);
                return found;
            }
            return null;
        } catch (e) {
            //ToDo: Log
            Logger.error(`Fetch package of address '${address}' failed with error ${JSON.stringify(e)} when use provider ${this._iotaProvider}`);
            //if all not found, then will reject, so get the exception
            //we return an empty object to indicate it no result
            return null;
        }
    }
}