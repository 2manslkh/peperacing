const mongoose = require("mongoose");

const Whitelist = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: false,
  },
  stage: {
    type: Number,
    required: true,
    unique: false,
  },
  amount: {
    type: Number,
    required: false,
    unique: false,
  },
});

module.exports = mongoose.model("whitelistMint", Whitelist);
