const express = require("express");
const router = express.Router();

const { getWhitelistSignature } = require("../controllers/Signing");

router.route("/sign").post(getWhitelistSignature);

module.exports = router;
