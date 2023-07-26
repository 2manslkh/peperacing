const fs = require("fs");
const path = require("path");

const categories = ["celestial", "galaxy", "spirit", "terrestrial"];
const baseDir = "./";
const finalDir = "./final";
const imageDir = path.join(finalDir, "images");
const jsonDir = path.join(finalDir, "json");

// Create final directories if they don't exist
if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir);
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);
if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir);

let allData = [];
let tokenId = 6;

categories.forEach((category) => {
  const categoryDir = path.join(baseDir, category);
  const images = fs.readdirSync(path.join(categoryDir, "images"));
  const jsons = fs.readdirSync(path.join(categoryDir, "json"));

  images.forEach((image, index) => {
    const oldImagePath = path.join(categoryDir, "images", image);
    const oldJsonPath = path.join(categoryDir, "json", jsons[index]);
    const metadata = JSON.parse(fs.readFileSync(oldJsonPath, "utf-8"));
    metadata.name = `ArgoPetz #${tokenId}`;
    metadata.id = tokenId;
    metadata.image = `ipfs://NewUriToReplace/${tokenId}.png`;

    allData.push({ image: oldImagePath, metadata: metadata });
    tokenId++;
  });
});

// Shuffle data from tokenId 6 onwards
const reservedData = allData.slice(0, 5);
const shuffledData = allData.slice(5).sort(() => Math.random() - 0.5);
allData = [...reservedData, ...shuffledData];

// Write shuffled data to final directory
allData.forEach((data, index) => {
  const newTokenId = index + 6;
  const newImagePath = path.join(imageDir, `${newTokenId}.png`);
  const newJsonPath = path.join(jsonDir, `${newTokenId}.json`);

  fs.copyFileSync(data.image, newImagePath);
  data.metadata.name = `ArgoPetz #${newTokenId}`;
  data.metadata.id = newTokenId;
  data.metadata.image = `ipfs://NewUriToReplace/${newTokenId}.png`;
  fs.writeFileSync(newJsonPath, JSON.stringify(data.metadata, null, 2));
});

// Write _metadata.json
const allMetadata = allData.map((data) => data.metadata);
fs.writeFileSync(
  path.join(finalDir, "_metadata.json"),
  JSON.stringify(allMetadata, null, 2)
);
