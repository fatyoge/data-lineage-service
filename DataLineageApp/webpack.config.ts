﻿import * as webpack from "webpack";
import * as path from "path";
import * as fs from "fs";
import * as CopyWebpackPlugin from "copy-webpack-plugin";
declare var __dirname;

const config: webpack.Configuration = {
    entry: {
        "client-app": "./src/client/client-app.ts",
        "client-app-tree": "./src/client/client-app-tree.ts",
        "simulate-publisher": "./src/client/simulate/publisher-app.tsx",
        "simulate-processor": "./src/client/simulate/processor-app.tsx"
    },
    output: {
        path: path.resolve(__dirname, "./dist/public/javascripts/"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: { onlyCompileBundledFiles: true }
                    },
                    "ts-nameof-loader"
                ], //can use either 'awesome-typescript-loader' or "ts-loader", 'awesome-typescript-loader' will compiler ts file in memeory so no js file is generated (finnally, js will be bundle with webpack)
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    plugins: [
        new CopyWebpackPlugin([
            // {output}/directory/with/extension.ext/file.txt
            {
                from: "./**",
                to: path.resolve(__dirname, "./dist/public/"),
                toType: "dir",
                context: path.resolve(__dirname, "./src/server/public/"),
                flatten: false
            },
            {
                from: "src/server/views/*",
                to: path.resolve(__dirname, "./dist/views/"),
                toType: "dir",
                flatten: true
            }
        ], {
            ignore: [

            ],
            // By default, we only copy modified files during
            // a watch or webpack-dev-server build. Setting this
            // to `true` copies all files.
            copyUnmodified: false
        })
    ],
    externals: {
        jquery: "jQuery",
        bootstrap: "bootstrap",
        d3: "d3"/*,
        toastr: "toastr"*/
    },
    devtool: "cheap-module-source-map"
};

const nodeModules: any = {};
fs.readdirSync("node_modules")
  .filter(function(x) {
    return [".bin"].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = "commonjs " + mod;
  });

const configServer:webpack.Configuration = {
    entry: {
        "server-app": "./src/server/server-app.ts"
    },
    target: "node",
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",//can use either 'awesome-typescript-loader' or "ts-loader", 'awesome-typescript-loader' will compiler ts file in memeory so no js file is generated (finnally, js will be bundle with webpack)
                exclude: /node_modules/,
                options: { onlyCompileBundledFiles: true }
            },
            {
                type: 'javascript/auto',
                test: /\.mjs$/,
                use: []
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    context: __dirname,
    node: {
        __filename: false,
        __dirname: false
    },
    externals: nodeModules,
    devtool: "source-map"
};
export default (env, options) => {
    if (options.mode === "development") {
        console.log(`options.mode is development, change the devtool of client config to cheap-module-eval-source-map`);
        config.devtool = "cheap-module-eval-source-map";
        console.log(`options.mode is development, change the devtool of server config to eval-source-map`);
        configServer.devtool = "eval-source-map";
    }
    console.log(`client config.devtool is ${config.devtool}`);
    console.log(`server config.devtool is ${configServer.devtool}`);
    return [config, configServer];
};