const fs = require("fs");
const path = require("path");
const fastcsv = require("fast-csv");

function updateJsonWithCsv(csvFilePath, jsonFilePath) {
  let jsonData;

  if (fs.existsSync(jsonFilePath)) {
    jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
  } else {
    jsonData = {
      phase1: { addresses: [] },
      phase2: { addresses: [] },
      freeMint: { addresses: [], amounts: [] },
    };
  }

  const records = [];

  fs.createReadStream(csvFilePath)
    .pipe(fastcsv.parse({ headers: true, skipEmptyLines: true }))
    .on("data", (row) => records.push(row))
    .on("end", () => {
      for (const record of records) {
        if (record.phase in jsonData) {
          // Check if address is valid

          const addressLowerCase = record.address.toLowerCase();

          if (isValidAddress(addressLowerCase)) {
            const index =
              jsonData[record.phase].addresses.indexOf(addressLowerCase);

            if (index === -1) {
              // address not found
              jsonData[record.phase].addresses.push(addressLowerCase);

              if (record.phase === "freeMint" && record.amount) {
                jsonData.freeMint.amounts.push(Number(record.amount));
              }
            } else if (record.phase === "freeMint" && record.amount) {
              // address found in freeMint
              jsonData.freeMint.amounts[index] = Number(record.amount); // update the amount
            }
          }
        }
      }

      // Write the updated JSON data back to the file
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");
    });
}

function isValidAddress(address) {
  return /^(0x)[0-9a-fA-F]{40}$/.test(address);
}

// Test the function
updateJsonWithCsv(
  path.join(__dirname, "../data/whitelist.csv"),
  path.join(__dirname, "../data/whitelist.json")
);
