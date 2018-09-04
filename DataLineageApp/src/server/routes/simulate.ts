import express = require("express");
const routerUI = express.Router();

/* GET simulate UI. */
routerUI.get("/publisher", (req, res) => {
    res.render("simulate-publisher", { title: "Publish data integrity information" });
});

routerUI.get("/processor", (req, res) => {
    res.render("simulate-processor", { title: "Publish data lineage information" });
});

interface IPackageSubmitData {
    inputs?: string[];
    wayOfProof: string;
    value;
    dataPackageId?: string;
}

export {routerUI};
