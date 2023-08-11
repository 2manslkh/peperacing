const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const metadata = require("../build/json/_metadata.json");

const layersOrder = [
  { name: "Archetype" },
  { name: "Background" },
  { name: "Aura" },
  { name: "Base" },
  { name: "Clothing" },
  { name: "Hand Accessories" },
  { name: "Head Accessories" },
  { name: "Face" },
];

const recreateNft = async (metadata, layersOrder) => {
  const canvas = createCanvas(4500, 4500);
  const ctx = canvas.getContext("2d");

  for (let layer of layersOrder) {
    const attribute = metadata.attributes.find((attr) =>
      layer.name.includes(attr.trait_type)
    );
    console.log(attribute);
    if (attribute) {
      const imgPath = `../layers/${layer.name}/${attribute.value}.png`;
      console.log(imgPath);
      if (fs.existsSync(imgPath)) {
        // console.log(imgPath);
        const img = await loadImage(imgPath);
        console.log(img);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Resize image to fit canvas
      }
    }
  }

  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(`./output/${metadata.id}.png`);
    const stream = canvas.createPNGStream();

    out.on("finish", () => resolve()); // Resolve the promise when writing is done
    out.on("error", reject); // Reject the promise on write error

    stream.pipe(out);
  });
};

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
      console.log("Found Argo Petz: " + metadata[i].id);
      result.push(metadata[i].id);
    }
  }

  return result;
}

async function main() {
  // let affected = findArgoPetz(metadata);
  // console.log(affected);
  let affected = [8889];
  for (let i = 0; i < affected.length; i++) {
    let edition = affected[i];
    console.log("Recreating edition: " + edition);
    let metadata = require(`../build/json/${edition}.json`);
    await recreateNft(metadata, layersOrder);
  }
}
main();
