export interface IDataPackage {
    /*
     * A number representing the milliseconds elapsed since the UNIX epoch in Utc
     * according to js definition, it's the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
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
    wayOfProof: string;
    valueOfProof: string;
    /*
     * The address of MAM for each input of the data package
     */
    inputs: string[];
    operation?: string;
    ownerMetadata?: any;
}


export class PackageHelper {
    static isRealPackage(pkg: IDataPackage): boolean {
        return typeof pkg.inputs !== "undefined" ||
            typeof pkg.dataPackageId !== "undefined" ||
            typeof pkg.timestamp !== "undefined";
    }
    static readonly PROOF_VALUE = "copy of original data";
    static readonly PROOF_STANDARD = "sha256(packageid, value, timestamp)";
}