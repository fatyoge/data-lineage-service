import IOTA = require("iota.lib.js");

// Import the Monkey Patch for the IOTA lib
import * as usePowSrvIO from "../../node_modules/iota.lib.js.powsrvio"

import * as Mam from "../../../mam.client.js/lib/mam.client";
import Utilities from "../common/utilities";
import { IDataPackage } from "../server/data-package";
import { Logger, LogEvents, LogEventMeasurements, LogEventProperties } from "../common/logger";

export interface IIOTAWriterJsonData {
    iotaProvider: string;
    seed: string;
    lastUsedAddress;
}

export interface IAttachSuccessResult {
    address: string;
    nextRoot: string;
}

export interface IAttachFailedResult {
    error: string ;
}

export default class IOTAWriter {
    private readonly _iota: IOTA;
    private _lastMamState;
    private _lastUsedAddress: string;

    constructor(private readonly _iotaProvider: string, private readonly _seed?: string, lastUsedAddress?: string) {
        if (!_seed) {
            Logger.log("IOTAWriter: Creating an IOTAWriter without seed.");
            throw new Error("seed is missing");
        }
        Logger.log(`Creating IOTA writer with provider:  ${_iotaProvider}`);
        this._iota = new IOTA({ provider: _iotaProvider });

        // Patch the current IOTA instance
        usePowSrvIO(this._iota, 5000, null);

        if (lastUsedAddress) {
            this._lastUsedAddress = lastUsedAddress;
        }
    }

    public static toJsonData(writer: IOTAWriter): IIOTAWriterJsonData|undefined {
        if (!writer || !writer._seed || !writer._iotaProvider) {
            Logger.error("IOTAWriter: iotaWriter is not a valid writer or _iotaProvider, or _seed is missing");
            return undefined;
        }
        return {
            iotaProvider: writer._iotaProvider,
            seed: writer._seed,
            lastUsedAddress: writer._lastUsedAddress
        };
    }

    private logEventProps(logSerialTag: string): any {
        return { [LogEventProperties.Serial]: this._seed, [LogEventProperties.Serial]: logSerialTag };
    }

    /**
     * make sure the _lastMamState represent the last address of the attached node in the channel, so that the new add node can be attached successfully
     */
    private async initLastMamState(logSerialTag: string): Promise<void> {
        if (this._lastMamState) {
            return;
        }
        Logger.log("IOTAWriter: Searching the last used address in the channel...");
        let startTime = Date.now();
        let mamState = Mam.init(this._iota, this._seed);
        Logger.event(LogEvents.Performance, this.logEventProps(logSerialTag), { [LogEventMeasurements.MamInit]: Date.now() - startTime });
        startTime = Date.now();
        //as the seed may already exist, and after Mam.init, mamState always points to the root of the channel, we need to make mamState point to the last
        let rootAddress = Mam.getRoot(mamState);
        Logger.event(LogEvents.Performance, this.logEventProps(logSerialTag), { [LogEventMeasurements.MamGetRoot]: Date.now() - startTime });
        let preAddress: string | undefined = undefined; //if keep undefined, means 

        //if we already know the last used address, jump to it directly
        if (this._lastUsedAddress) {
            rootAddress = this._lastUsedAddress;
            preAddress = this._lastUsedAddress;
        }

        while (true) {
            Logger.log(`IOTAWriter: checking address ${rootAddress} if is used or not...`);
            startTime = Date.now();
            const one: { nextRoot: string, payload: string } = await Mam.fetchSingle(rootAddress, "public");
            Logger.event(LogEvents.Performance, this.logEventProps(logSerialTag), { [LogEventMeasurements.MessageFetch]: Date.now() - startTime });
            const used = one && one.payload;
            Logger.log(`IOTAWriter: address ${rootAddress} is ${used ? "used" : "last"}`);
            if (!used) break;
            preAddress = rootAddress;
            rootAddress = one.nextRoot;
        }
        if (preAddress) {
            this._lastUsedAddress = preAddress;
        }
        let message: { payload: string, address: string, state: any };
        //loop until message is point to the last attached node
        //if preAddress not defined, means the channel is empty (previous "while" loop stopped at used check for the first time)
        while (preAddress) {
            startTime = Date.now();
            message = Mam.create(mamState, this._iota.utils.toTrytes(JSON.stringify({ "data": "This is a fake message to find last address" })));
            Logger.event(LogEvents.Performance, this.logEventProps(logSerialTag), { [LogEventMeasurements.MamStateUpdate]: Date.now() - startTime });
            if (message.address === preAddress) {
                break;
            }
            mamState = message.state;
        }
        Logger.log(`IOTAWriter: Updated MAM client state to last used address of seed: ${(this._seed as string).substring(0, 5)}...`);
        this._lastMamState = mamState;
    }

    /**
     * @returns if success, return the address of the package and the next root address in the same channel, otherwise return undefined
     * @param newPackage
     */
    public async attachNew(newPackage: IDataPackage): Promise<IAttachSuccessResult | IAttachFailedResult> {
        const serial = newPackage.dataPackageId;
        const fullTimeStart = Date.now();
        try {
            await this.initLastMamState(serial);
        } catch (e) {
            return { error: Logger.error(`IOTAWriter: check the last address for seed ${this._seed} failed, exception is ${JSON.stringify(e)}`) };
        }
        const json = JSON.stringify(newPackage);
        let startTime = Date.now();
        if (Utilities.containsUnicode(json)) {
            const err = "IOTAWriter: the package data contains none ASCII chars";
            Logger.error(err);
            return { error: err };
        }
        Logger.event(LogEvents.Performance, this.logEventProps(serial), { [LogEventMeasurements.MessageDataNonASCIIVerify]: Date.now() - startTime });
        Logger.log(`IOTAWriter: converting new package ${json} to trytes`);
        // Create Trytes
        startTime = Date.now();
        const trytes = this._iota.utils.toTrytes(json);
        Logger.event(LogEvents.Performance, this.logEventProps(serial), { [LogEventMeasurements.MessageDataTrytes]: Date.now() - startTime });
        if (!trytes) {
            const err = `IOTAWriter: MAM library can't convert the json string ${json} to trytes string`;
            Logger.error(err);
            return { error: err };
        }

        Logger.log(`IOTAWriter: createing message for new package ${json} ...`);
        startTime = Date.now();
        // Get MAM payload
        const message: { payload: string, address: string, state: any } = Mam.create(this._lastMamState, trytes);
        Logger.event(LogEvents.Performance, this.logEventProps(serial), { [LogEventMeasurements.MessageCreate]: Date.now() - startTime });
        Logger.log(`IOTAWriter: begin attaching message to iota for new package ${json} ...`);
        startTime = Date.now();
        // Attach the payload.
        const result = await Mam.attach(message.payload, message.address);
        Logger.event(LogEvents.Performance, this.logEventProps(serial), { [LogEventMeasurements.MessageAttach]: Date.now() - startTime });
        
        if (typeof result === "undefined"||typeof (result.length) === "undefined") {
            //the Mam.attach return caught error, means it failed
            const err = `MAM library can't attach the package to trytes, the error is ${JSON.stringify(result)}`;
            Logger.error(err);
            return { error: err };
        }
        // update mamState as new mamState
        this._lastMamState = message.state;
        this._lastUsedAddress = message.address;
        Logger.log(`IOTAWriter: package ${json} is attached, the address is ${message.address}`);
        Logger.event(LogEvents.Performance, this.logEventProps(serial), { [LogEventMeasurements.FullWrite]: Date.now() - fullTimeStart });
        return { address: message.address, nextRoot: message.state.channel.next_root };
    }

    public static attachFailed(result: IAttachSuccessResult | IAttachFailedResult): result is IAttachFailedResult {
        return (typeof (result as IAttachFailedResult).error) !== "undefined";
    }
}