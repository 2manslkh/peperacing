// Require the File System module
const fs = require("fs");

// Read the file synchronously, and then parse the JSON
var metadata = JSON.parse(
  fs.readFileSync("./build/json/_metadata.json", "utf8")
);

// Function to replace 'NewUriToReplace' in image URI
function replaceUri(item) {
  item.image = item.image.replace(
    "bafybeic2txcz4sgitlyoeas3scntszrp63dpznf5c5evjdb5whpb5hbozy",
    "bafybeihxngrk7bor4dxao2elal3eb66slhijxiipxlvdmdpuiahpqlbpju"
  );
  return item;
}

// Use the map function to apply replaceUri to each item in the array
var updatedMetadata = metadata.map(replaceUri);

// Convert the updatedMetadata back to a JSON string
var updatedMetadataJson = JSON.stringify(updatedMetadata, null, 2);

// Write the updatedMetadataJson back to 'metadata.json' or to a new file if you prefer
fs.writeFileSync("./_metadata.json", updatedMetadataJson);

console.log("Metadata updated!");

// Based on metadata.json, generate into a folder of json files for each token
// Loop through each item in the metadata.json file
for (var i = 0; i < metadata.length; i++) {
  // Get the token ID
  var tokenId = metadata[i].id;
  // Convert the tokenId to a string
  var tokenIdString = tokenId.toString();
  // Create a new JSON file for each token
  fs.writeFileSync(
    "./build/json/" + tokenIdString + ".json",
    JSON.stringify(metadata[i], null, 2)
  );
}
// Create a map of trait occurrences for each trait type
const traitOccurrences = {};

metadata.forEach(({ attributes }) => {
  attributes.forEach(({ trait_type, value }) => {
    if (!traitOccurrences[trait_type]) {
      traitOccurrences[trait_type] = {};
    }

    if (!traitOccurrences[trait_type][value]) {
      traitOccurrences[trait_type][value] = 0;
    }

    traitOccurrences[trait_type][value]++;
  });
});

// Map the trait occurrences to the desired output format
const rarity = {};

Object.entries(traitOccurrences).forEach(([traitType, traits]) => {
  rarity[traitType] = Object.entries(traits).map(([trait, count]) => {
    const occurrencePercentage = ((count / metadata.length) * 100).toFixed(2);
    return {
      trait,
      occurrence: `${count} in ${metadata.length} editions (${occurrencePercentage} %)`,
    };
  });
});

// Convert the rarity object to a JSON string
const rarityJson = JSON.stringify(rarity, null, 2);

// Print out total number of occurences for each trait type
Object.entries(traitOccurrences).forEach(([traitType, traits]) => {
  const total = Object.values(traits).reduce((a, b) => a + b, 0);
  console.log(`Total ${traitType}: ${total}`);
});

// Write the rarityJson to 'rarity.json'
fs.writeFileSync("./rarity.json", rarityJson);

console.log("Rarity data has been generated!");
