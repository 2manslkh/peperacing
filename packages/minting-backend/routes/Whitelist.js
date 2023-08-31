const express = require("express");
const router = express.Router();

const { isWhitelisted } = require("../controllers/Whitelist");

router.route("/info").get(isWhitelisted);

module.exports = router;
