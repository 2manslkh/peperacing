const fs = require("fs");
const fastcsv = require("fast-csv");

// Read the file
let rawdata = fs.readFileSync("rarity.json");
// Parse the JSON data
let data = JSON.parse(rawdata);

// Parsing function
function parseJson(jsonData) {
  let csvData = [];
  // Iterate over each category in the JSON data
  for (let category in jsonData) {
    // Iterate over each item in the category
    jsonData[category].forEach((item) => {
      // Extract occurrence and percentage
      const [occurrence, percentage] = item.occurrence.split(" (");
      // Push the data to the csvData array
      csvData.push({
        Trait: item.trait,
        Occurrence: occurrence,
        Percentage: percentage.slice(0, -2), // removing trailing '%' and space
      });
    });
  }
  return csvData;
}

// Call the function with the JSON data
let csvData = parseJson(data);

fastcsv
  .writeToPath("output.csv", csvData, { headers: true })
  .on("error", (err) => console.error(err))
  .on("finish", () => console.log("Done writing to CSV!"));
