# Data Lineage Viewer  [![Build Status](https://travis-ci.com/veracity/data-lineage-service.svg?branch=master)](https://travis-ci.com/veracity/data-lineage-service)
This data lineage viewer is a web based application that visualize the data lineage information, based on the paper [Data Integrity and Lineage by using IOTA](http://fenglu.me/2018/04/16/Data-integrity-and-data-lineage-by-using-IOTA/ "Data Integrity and Lineage by using IOTA"). 

It also provides user-friendly web interface for publishing integrity and lineage information to tangle.

In addition, all functionalities are exposed as APIs, which helps developers to build/extend their applications to integrate with tangle quickly, without having deep understanding of IOTA or MAM protocol.

## Live demo
https://datalineage-viewer.azurewebsites.net

The demo application is connecting to the IOTA Mainnet, by using the following node(s):
- https://nodes.thetangle.org:443

*NOTE*: Public nodes can be offline without notice. Check more public nodes from community, such as https://www.tangle-nodes.com/index.php?sorts[load]=1

## Functionalities
### Lineage viewer
This application can visualize the data lineage information, such as input/output, owner information, etc.
### Publish data to tangle
This application also provide user friendly interface for publishing data to tangle. Since these simulators do talk to IOTA mainnet, you can use them to write into tangle that will be available for all iota users.
1. Publish data integrity information
2. Publish data lineage information

## APIs
all functionalities are exposed as APIs. 
The detailed API documentation can be found at https://datalineage-viewer.azurewebsites.net/swagger/ 

## Technical details
### Architecture
![Architecture](https://github.com/veracity/DataLineage-Viewer/blob/master/Doc/System%20architect.png?raw=true)

This application is using the official IOTA MAM library https://github.com/iotaledger/mam.client.js for interacting with IOTA tangle. Besides, it is based on Nodejs and Typescript for both frontend and server side.

### Connect to IOTA network
The application supports fall-back mechanism for connecting to multiple nodes: You specify a list of nodes in [config file](https://github.com/veracity/DataLineage-Viewer/blob/master/DataLineageApp/src/server/server-config.ts). The application will try to use the first one. If that is not working, then the application try to use the second one, etc... It helps especially if you are using public nodes and not sure if they are online.

It also supports proxy to speed up the access to the IOTA.

### Outsourcing PoW
In order to speed up MAM message throughput, instead of run PoW on the Iota node that the application is connecting with, this task is delegated to 3rd party Pow provider https://powsrv.io/ (with free tier). 

### Override Configuration
As mentationed in above, you can specify the IOTA node address (and other settings) in [config file](https://github.com/veracity/DataLineage-Viewer/blob/master/DataLineageApp/src/server/server-config.ts), but we also support to overwrite the value in the static source code. When server start running, it will load the content of file **server-config** first (it is a json file that is of the same schema of the `IConfig`) in the **data** folder. Then, if one of the config values is not presented in the loaded file content, the default value from the source code will be used. So it is possible to provide the server-config file to overwrite the default value in source code.

### Caching
In order to have a good performance, also considering the data is immutable in tangle (assuming it talks to a [permanode](https://iota.stackexchange.com/questions/782/full-node-vs-permanode/783)), we decide to use caching. 

It means that, whenever the client is requesting package information from an address, the API will check the memory cache first. 
- if the data for this address already exists in cache, simply return it.
- if the data does not exist, the server will talk to IOTA node that it is connecting with, fetch the data, store it in cache, and then return it.
For every 3 minutes, the server will save the memory cache to disk file. In case the server was reboot, the cache can be loaded from file to memory.

The cache files are stored in /data folder of the web application server.
- package.cache
- iotaWriter.cache (one iotawriter object per one seed/channel, all stored in this cache file)

### Application Insight
This app use the Microsoft Application Insight to tracking and logging. If the application is hosted in Azure, you can provide an ikey via the environment variable APPINSIGHTS_INSTRUMENTATIONKEY, or set it directly in the code `logger.ts`, for more information, please refer to the document [Monitor your Node.js services and apps with Application Insights](https://docs.microsoft.com/en-us/azure/application-insights/app-insights-nodejs "Monitor your Node.js services and apps with Application Insights")

## How to init submodule after cloned the source code
```cmd
git submodule update --init 
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


Enjoy!
