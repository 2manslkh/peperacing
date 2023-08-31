const express = require("express");
const router = express.Router();

const { getWhitelistSignatureAkiverse } = require("../controllers/Signing");

router.route("/akiverse/sign").post(getWhitelistSignatureAkiverse);

module.exports = router;
