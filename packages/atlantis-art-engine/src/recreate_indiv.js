const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

const layersOrder = [
  { name: "Background" },
  { name: "Back Accessories" },
  { name: "Base" },
  { name: "Clothing" },
  { name: "Face Accessories" },
  { name: "Eyes" },
  { name: "Head Accessories" },
  { name: "Mouth" },
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
        console.log(imgPath);
        const img = await loadImage(imgPath);
       // console.log(img);
       ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Resize image to fit canvas
      }
    }
  }

  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(`./${metadata.id}.png`);
    const stream = canvas.createPNGStream();

    out.on("finish", () => resolve()); // Resolve the promise when writing is done
    out.on("error", reject); // Reject the promise on write error

    stream.pipe(out);
  });
};

async function main() {
  let affected = [
    4999,5000
  ];

  for (let i = 0; i < affected.length; i++) {
    let edition = affected[i];
    console.log("Recreating edition: " + edition);
    let metadata = require(`../build/json/${edition}.json`);
    await recreateNft(metadata, layersOrder);
  }



}
main();
