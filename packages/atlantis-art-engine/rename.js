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
    const [name, number] = Object.values(row)[0].split("#");

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
          const fileName = file.split(".")[0];
          if (fileName === name) {
            const oldPath = `${layerDir}/${file}`;
            const newPath = `${layerDir}/${fileName}#${number}.png`;
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
