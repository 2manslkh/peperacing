import { deployments, ethers } from 'hardhat';

import csv from 'csv-parser';
import fs from 'fs';

export async function getContract(contractName: string): Promise<unknown> {
  return await ethers.getContractAt(contractName, (await deployments.get(contractName)).address);
}

function parse(data: number) {
  let out = ethers.hexZeroPad(ethers.hexlify(Number(data)), 2).slice(2);
  return out;
}

export const getGemstoneArray = (fileName: string): Promise<string> => {
  let levelUpGemstone: any = '';

  return new Promise((resolve, reject) => {
    fs.createReadStream(fileName)
      .on('error', (error: any) => {
        reject(error);
      })
      .pipe(csv({ separator: ',' }))
      .on('data', (data: any) => {
        levelUpGemstone +=
          parse(data.cC1) +
          parse(data.cC2) +
          parse(data.cC3) +
          parse(data.cC4) +
          parse(data.cU1) +
          parse(data.cU2) +
          parse(data.cU3) +
          parse(data.cU4) +
          parse(data.cR1) +
          parse(data.cR2) +
          parse(data.cR3) +
          parse(data.cR4) +
          parse(data.cE1) +
          parse(data.cE2) +
          parse(data.cE3) +
          parse(data.cE4);
      })
      .on('end', () => {
        resolve('0x' + levelUpGemstone);
      });
  });
};

export const chunkArray = (myArray: any[], chunk_size: number): any[][] => {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray: any[][] = [];
  var myChunk: any[] = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
};

export const setupOrbitArray = (): any[] => {
  let orbitArray = Array.from({ length: 6012 }, (v, k) => k % 4); // 0 - Common, 1 - Uncommon, 2 - Rare, 3 - Epic
  orbitArray[12] = 0;
  orbitArray[13] = 0;
  orbitArray[14] = 0;
  orbitArray[15] = 0;

  orbitArray[16] = 1;
  orbitArray[17] = 1;
  orbitArray[18] = 1;
  orbitArray[19] = 1;

  orbitArray[20] = 2;
  orbitArray[21] = 2;
  orbitArray[22] = 2;
  orbitArray[23] = 2;

  orbitArray[24] = 3;
  orbitArray[25] = 3;
  orbitArray[26] = 3;
  orbitArray[27] = 3;

  return orbitArray;
};

// Create a array of 6000 elements starting from 13 and incrementing by 1, ending at 6012
export const setupIdArray = (): any[] => {
  return Array.from({ length: 6000 }, (v, k) => k + 13);
};

export const setupElementArray = (): any[] => {
  let elementArray = Array.from({ length: 6000 }, (v, k) => k % 3); // 0 - Fire, 1 - Lightning, 2 - Steel
  // Shuffle the array
  for (let i = elementArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [elementArray[i], elementArray[j]] = [elementArray[j], elementArray[i]];
  }
  return elementArray;
};

export const generateBackgroundArray = (): any[] => {
  // 1500 of each base (no repetition)

  // Create an array of 2000 of repeating 0,1,2,3 pattern
  let baseArray = Array.from({ length: 6000 }, (v, k) => k % 4);

  // shuffle the array
  for (let i = baseArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baseArray[i], baseArray[j]] = [baseArray[j], baseArray[i]];
  }

  return baseArray;
};

export const generateOrbitArrays = (): any[2][] => {
  // Create an array of 800 0s,1s,2s,3s,4s, 555 5s, 6s, 7s, 168 8s, 167 9s
  /**
 *      if (orbitName == AtlantisLib.OrbitName.HALO_RING) {
          return "Halo Ring";
        } else if (orbitName == AtlantisLib.OrbitName.PANDORA) {
            return "Pandora";
        } else if (orbitName == AtlantisLib.OrbitName.ATLAS) {
            return "Atlas";
        } else if (orbitName == AtlantisLib.OrbitName.METIS) {
            return "Metis";
        } else if (orbitName == AtlantisLib.OrbitName.ENTWINED) {
            return "Entwined";
        } else if (orbitName == AtlantisLib.OrbitName.RAINBOW_CLOUDS) {
            return "Rainbow Clouds";
        } else if (orbitName == AtlantisLib.OrbitName.GALATICA) {
            return "Galatica";
        } else if (orbitName == AtlantisLib.OrbitName.ASTEROIDS) {
            return "Asteroids";
        } else if (orbitName == AtlantisLib.OrbitName.INTERSTELLAR_PINK) {
            return "Interstellar Pink";
        } else if (orbitName == AtlantisLib.OrbitName.INTERSTELLAR_GRADIENT) {
            return "Interstellar Gradient";
            // Epic planets
        } else if (orbitName == AtlantisLib.OrbitName.INTERSTELLAR_GOLD) {
            return "Interstellar Gold";
        } else {
            return "";
        }
   */
  let orbitArray = Array.from({ length: 800 }, (v, k) => 0) // Halo Ring
    .concat(Array.from({ length: 800 }, (v, k) => 1)) // Pandora
    .concat(Array.from({ length: 800 }, (v, k) => 2)) // Atlas
    .concat(Array.from({ length: 800 }, (v, k) => 3)) // Metis
    .concat(Array.from({ length: 800 }, (v, k) => 4)) // Entwined
    .concat(Array.from({ length: 555 }, (v, k) => 5)) // Rainbow Clouds
    .concat(Array.from({ length: 555 }, (v, k) => 6)) // Galatica
    .concat(Array.from({ length: 555 }, (v, k) => 7)) // Asteroids
    .concat(Array.from({ length: 168 }, (v, k) => 8)) // Interstellar Pink
    .concat(Array.from({ length: 167 }, (v, k) => 9)); // Intersetallar Gradient

  // shuffle the array
  for (let i = orbitArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orbitArray[i], orbitArray[j]] = [orbitArray[j], orbitArray[i]];
  }

  // Create the orbit tier array from the orbitArray
  let orbitTierArray = [];
  // if orbit is between 0 and 4, orbit tier = 0
  // if orbit is between 5 and 7, orbit tier = 1
  // if orbit is between 8 and 9, orbit tier = 2
  for (let i = 0; i < orbitArray.length; i++) {
    if (orbitArray[i] < 5) {
      orbitTierArray.push(0); // Common if id is less than 5
    } else if (orbitArray[i] < 8) {
      orbitTierArray.push(1);
    } else {
      orbitTierArray.push(2);
    }
  }

  return [orbitArray, orbitTierArray];
};
export const generateBaseArray = (): any[] => {
  let baseArray = Array.from({ length: 6000 }, (v, k) => k % 3);

  // shuffle the array
  for (let i = baseArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baseArray[i], baseArray[j]] = [baseArray[j], baseArray[i]];
  }

  return baseArray;
};
