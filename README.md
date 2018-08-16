# Data Lineage Viewer  [![Build Status](https://travis-ci.com/veracity/DataLineage-Viewer.svg?branch=master)](https://travis-ci.com/veracity/DataLineage-Viewer)
This data lineage viewer is a web based application that visualize the data lineage information, based on the paper [Data Integrity and Lineage by using IOTA](http://fenglu.me/2018/04/16/Data-integrity-and-data-lineage-by-using-IOTA/ "Data Integrity and Lineage by using IOTA").

## Live demo
http://datalineage-viewer.azurewebsites.net

The demo application is connecting to the IOTA Mainnet, by using the following nodes:
- https://nodes.iota.fm
- https://iotanode.us:443

## Technical details
This application is using the official IOTA MAM library https://github.com/iotaledger/mam.client.js for interacting with IOTA tangle. Besides, it is based on Nodejs and Typescript for both frontend and server side.

### Connect to IOTA network
The application supports fall-back mechanism for connecting to multiple nodes: You specify a list of nodes in [config file](https://github.com/veracity/DataLineage-Viewer/blob/master/DataLineageApp/src/server/server-config.ts). The application will try to use the first one. If that is not working, then the application try to use the second one, etc... It helps especially if you are using public nodes and not sure if they are online.

It also supports proxy to speed up the access to the IOTA.

### APIs
The server side has two APIs:
1. **/api/address/:address**: It loads data package information from a MAM address that is specified by parameter ":address". It is a "lazy load" that does **not** load information from *inputs* field.
1. **/api/address/:address/all**. This loads the data package information from specified address, **plus** it loads all upper stream address information **recursively** from *inputs* field. All information is loaded into one array.

### Publish functions
This application also provide publish functions for demo purpose. We call them . Since these simulators do talk to IOTA mainnet, you can use them to write into tangle that will be available for all iota users.
1. Publish data integrity information
2. Publish data lineage information

### Caching
In order to have a good performance, also considering the data is immutable in tangle (assuming it talks to a [permanode](https://iota.stackexchange.com/questions/782/full-node-vs-permanode/783)), we decide to use caching. 

It means that, whenever the client is requesting package information from an address, the API will check the memory cache first. 
- if the data for this address already exists in cache, simply return it.
- if the data does not exist, the server will talk to IOTA node that it is connecting with, fetch the data, store it in cache, and then return it.
For every 3 minutes, the server will save the memory cache to disk file. In case the server was reboot, the cache can be loaded from file to memory.

## How to clone the source code
```cmd
git clone https://github.com/veracity/DataLineage-Viewer.git
cd DataLineage-Viewer
git git submodule update --init 
```

## How to build and run locally
To build the code, in folder *"/DataLineageApp/"*, run the following commands:
```cmd
npm install
npm run build
```

The source code is under "*/DataLineageApp/src/*" folder. The webpack will build the code and copy all the required files for the application running to the folder "dist".

To debug locally, run the command:
```cmd
npm start
```

To debug with watch-enabled, run the command:
```cmd
npm run start:watch
```
this script will start webpack in watch mode and use nodemon to start server, so when there is any change on the client side, webpack will rebuild and copy the files, when there is a change on the server side, nodemon will find it, build and restart the server.

## Deploy 
1. `npm install` in the root of the project
1. `npm run build`
1. copy the package.json to dist folder
1. go to the dist folder and run `npm install`
1. copy everything in dist folder and deploy them to the server.

The project is tested with Nodejs 8.11.2

## API
We host the apis in http://datalineage-viewer.azurewebsites.net
##### GET /api/address/:address/:all?
**Parameters**:
- **address**: required, the iota mam address of the package
- **all**: optional, determin if the api should not only return the package specified by the address, but also return all the packages as the input of this pacakge and the packages as the inputs of these packages and so on. Any value for this parameter means get all packages, if not provided then only the package specified by the address will be returned.

**Result**:
Will return an array of the packages.

**Remark**:
To improve the performance, packages will be cached for two days by default, and the api will first check from the cache, if a matched package is found, then it will be return at once and not further query to IOTA

##### POST /api/simulate/:packageType/
**Headers**:
This api requires seed as the header "seed".

**Parameters**:
- **packageType**: required, it can be "lightweight" or "standard"

**Body**:
The body is the json of the package data, which is defined as below:
`interface IPackageSubmitData {
    inputs?: string[];
    value;
    dataPackageId?: string;
}`
If the package is lightweight, the value will be the data field of the submitted package, otherwise value, package id and timestamp will be combined as a string and use sha256 to generate the hash code which will be saved in the data field of the submitted package.
The body json can contain any other fields.

**Result**:
If the package is submitted to the IOTA successfully, then the submitted package will be returned, otherwise will return empty result.

**Remark**:
As IOTA doesn't have the api to get the last  address of the channel directly, so every time when a package will be being submitted, the api will first loop on the address chain and find the last address of the channel, and cache the mam status, so next time, if a mam status of a channel is found, the api will loop from this address instead.




Enjoy!
