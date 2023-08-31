const express = require("express");
const router = express.Router();

const { getSignature } = require("../controllers/Signing");

router.route("/sign").post(getSignature);

module.exports = router;
