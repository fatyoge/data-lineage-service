﻿import globalTunnel = require("global-tunnel");

const config: {
    iotaProviders: string[];
    pacakgeCacheSeconds: number;
    iotaWriterStateCacheSeconds: number;
    proxy?: { host: string; port: number; },
    useProxyIfConfigured(): void;
} = {
    /**
     * This supports multi iota nodes, when query an address, the request will be sent to all the providers, and the first returned result from any nodes will be used
     */
        iotaProviders: ["https://nodes.iota.fm", "https://iotanode.us:443"],
    /**
     * Determin how long the package information will be keep in memonry cache (in seconds), 0 means not expired.
     */
    pacakgeCacheSeconds: 3600 * 24 * 2,
    iotaWriterStateCacheSeconds: 3600 * 24,
    /**
     * Proxy used on server side, as iota nodes can't be accessed or network speed is not stable when being accessed from China, so we have to support proxy on server
     * The api call to iota nodes will go throguh this proxy, if the network from the server to iota is good, then this configraton can be removed, and backend server will access iota directly
     */ 
    /*proxy: {
        host: "127.0.0.1",
        port: 1080
    },*/

    useProxyIfConfigured: () => {
        if (isUsingProxy) return;
        if (config.proxy) {
            console.log("server-config is configured with a proxy, use it for all http(s) request from server");
            globalTunnel.initialize({
                host: config.proxy.host,
                port: config.proxy.port
            });
            isUsingProxy = true;
        }
    }
};

let isUsingProxy = false;

export default config;