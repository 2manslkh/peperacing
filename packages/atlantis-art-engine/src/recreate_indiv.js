const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const metadata = require("../spirit/json/_metadata.json");

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

async function main() {
  let affected = [
    1110, 1226, 1368, 144, 1602, 1742, 1782, 1913, 1962, 2272, 2308, 2404, 2455,
    2506, 2619, 2622, 2666, 2730, 2749, 285, 2889, 2900, 2967, 2997, 3168, 3245,
    3255, 330, 3327, 3343, 3351, 3423, 3473, 3714, 3891, 418, 4392, 4407, 4547,
    4599, 4739, 4772, 5133, 5212, 5295, 5578, 5588, 5785, 5930, 5952, 6121, 620,
    622, 6267, 6400, 6476, 6498, 6754, 6778, 7058, 7100, 7422, 7429, 7469, 7516,
    754, 7704, 7843, 7888, 7919, 7950, 7993, 8099, 8302, 8348, 8665, 928, 99,
  ];

  for (let i = 0; i < affected.length; i++) {
    let edition = affected[i];
    console.log("Recreating edition: " + edition);
    let metadata = require(`../build/json/${edition}.json`);
    await recreateNft(metadata, layersOrder);
  }
}
main();
