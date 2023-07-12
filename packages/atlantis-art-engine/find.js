const metadata = require("./build/json/_metadata.json");

function findArgoPetz(metadata) {
  let result = [];

  // Iterate over each object in the metadata
  for (let i = 0; i < metadata.length; i++) {
    const attributes = metadata[i].attributes;

    // Flags for "Face" trait being "Blowing" and "Head Accessories" trait being any type of "Hood"
    let faceIsBlowing = false;
    let headAccessoryIsHood = false;

    // Iterate over each attribute
    for (let j = 0; j < attributes.length; j++) {
      // Check for "Face" trait
      if (
        attributes[j].trait_type === "Face" &&
        attributes[j].value === "Blowing"
      ) {
        faceIsBlowing = true;
      }

      // Check for "Head Accessories" trait
      if (
        attributes[j].trait_type === "Head Accessories" &&
        attributes[j].value.toLowerCase().includes("hood")
      ) {
        headAccessoryIsHood = true;
      }
    }

    // If both conditions are met, add the edition to the result array
    if (faceIsBlowing && headAccessoryIsHood) {
      result.push(metadata[i].edition);
    }
  }

  return result;
}

console.log(findArgoPetz(metadata));
