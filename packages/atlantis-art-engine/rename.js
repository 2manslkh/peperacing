const fs = require("fs");
const csv = require("csv-parser");

const layersDir = "./layers";
const dataDir = "./data";
const csvFile = `${dataDir}/kazo.csv`;

fs.createReadStream(csvFile)
  .pipe(
    csv({
      headers: false,
    })
  )
  .on("data", (row) => {
    const name = Object.values(row)[2];
    const trait = Object.values(row)[1];
    const rarity = Object.values(row)[3];

    [
      "Back Accessories",
      "Background",
      "Base",
      "Clothing",
      "Eyes",
      "Face Accessories",
      "Head Accessories",
      "Mouth",
    ].forEach((layer) => {
      const layerDir = `${layersDir}/${layer}`;

      fs.readdir(layerDir, (err, files) => {
        if (err) throw err;

        files.forEach((file) => {
          // Remove png from file name
          let fileName = file.split(".")[0];
          if (fileName === name && layer === trait) {
            const oldPath = `${layerDir}/${file}`;
            // If Filename contains the string "None"
            // Replace the filename with just "None"
            if (fileName.includes("None")) {
              fileName = "None";
            }
            const newPath = `${layerDir}/${fileName}#${rarity}.png`;
            console.log("Old Path: ", oldPath);
            console.log("New Path: ", newPath);
            fs.rename(oldPath, newPath, (err) => {
              if (err) throw err;
              console.log(`Renamed ${oldPath} to ${newPath}`);
            });
          }
        });
      });
    });
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });
