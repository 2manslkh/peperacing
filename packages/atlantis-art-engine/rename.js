const fs = require("fs");
const csv = require("csv-parser");

const layersDir = "./layers";
const dataDir = "./data";
const csvFile = `${dataDir}/terrestrial.csv`;

fs.createReadStream(csvFile)
  .pipe(
    csv({
      headers: false,
    })
  )
  .on("data", (row) => {
    const [name, number] = Object.values(row)[0].split("#");

    [
      "Archetype",
      "Background",
      "Aura",
      "Base",
      "Clothing",
      "Face",
      "Hand Accessories",
      "Head Accessories",
    ].forEach((layer) => {
      const layerDir = `${layersDir}/${layer}`;

      fs.readdir(layerDir, (err, files) => {
        if (err) throw err;

        files.forEach((file) => {
          if (file.startsWith(name)) {
            const oldPath = `${layerDir}/${file}`;
            const newPath = `${layerDir}/${name}#${number}.png`;

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
