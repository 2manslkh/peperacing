const fs = require("fs");
const path = require("path");

// Directory containing the JSON files
const dirPath = "./build/json"; // adjust as needed

// Read JSON files from directory
fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }

  const aggregatedData = [];

  files.forEach((file, index) => {
    if (path.extname(file) === ".json") {
      const filePath = path.join(dirPath, file);
      const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      aggregatedData.push(fileData);
    }
  });

  // Write to _metadata.json
  fs.writeFileSync("_metadata.json", JSON.stringify(aggregatedData, null, 2));
});
