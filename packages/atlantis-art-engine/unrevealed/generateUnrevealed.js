const fs = require("fs");

// Original metadata
const metadataTemplate = {
  name: "KAZO #1",
  description:
    "KAZO is a thriving community of adventurers within the Base ecosystem. KAZO holders will be able to enjoy gamified experiences through KAZO Adventures, filled with staking and questing activities. Enter the world of KAZO today.",
  image:
    "ipfs://bafybeihufqjsvum7p6jcelc52oehwcg2pjil7yyjtmimlk3hhjbwjipkpe/KAZO%20Mint%20Reveal%20Poster.png",
  id: 1,
  attributes: [
    {
      trait_type: "Type",
      value: "Unrevealed",
    },
  ],
};

// Loop to create 5000 files
for (let i = 1; i <= 5000; i++) {
  const metadata = { ...metadataTemplate }; // Clone the original metadata
  metadata.name = `KAZO #${i}`;
  metadata.id = i;

  // Save the modified metadata to a new JSON file
  fs.writeFileSync(`${i}.json`, JSON.stringify(metadata, null, 2), "utf-8");
}

console.log("All files have been created!");
