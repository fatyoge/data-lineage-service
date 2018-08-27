﻿export interface IDataPackage {
    /*
     * A number representing the milliseconds elapsed since the UNIX epoch in Utc
     */
    timestamp: number;
    dataPackageId: string;
    /*
     * mam address of the package
     */
    mamAddress: string;
    /**
     * Next root address in the same channel
     */
    nextRootAddress: string;
    wayofProof: string;
    valueOfProof: string;
    /*
     * The address of MAM for each input of the data package
     */
    inputs: string[];
    operation?: string;
    ownerMetadata?: any;
}


export class PacakgeHelper {
    static isRealPackage(pkg: IDataPackage): boolean {
        return typeof pkg.inputs !== "undefined" ||
            typeof pkg.dataPackageId !== "undefined" ||
            typeof pkg.timestamp !== "undefined";
    }
    static readonly PROOF_VALUE = "copy of original data";
    static readonly PROOF_STANDARD = "sha256(packageId, value, timestamp)";
}