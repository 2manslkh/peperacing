const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

require("dotenv").config();

// ----------------------------------
// Routes Import
// ----------------------------------
const signing = require("./routes/Signing");
// ----------------------------------
// Middleware
// ----------------------------------
const app = express();

app.use(cors());
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
}

// ----------------------------------
// API Routes
// ----------------------------------

app.use("/signing", signing);

// ----------------------------------
// Express server
// ----------------------------------
const PORT = process.env.PORT || 4000;

app.server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

module.exports = app;
