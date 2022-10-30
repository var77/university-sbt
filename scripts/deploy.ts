import { ethers } from "hardhat";
import path from 'path';
import fs from 'fs';

const NETWORK = process.env.HARDHAT_NETWORK;
const NETWORK_IDS = {
  localhost: 31337,
  goerli: 5
};

async function main() {
  const UniversityDiploma = await ethers.getContractFactory("UniversityDiploma");
  const testDiploma = await UniversityDiploma.deploy("TestUniversity", "TSBT")

  await testDiploma.deployed();

  console.log(`Diploma Contract deployed to ${testDiploma.address}`);
  moveAbis(testDiploma.address);
}

function moveAbis(contractAddress: string) {
  const contractAbi = require('../artifacts/contracts/UniversityDiploma.sol/UniversityDiploma.json').abi;
  // @ts-ignore
  const contractData = JSON.stringify({ abi: contractAbi, networks: { [NETWORK_IDS[NETWORK]]: { address: contractAddress } } });
  fs.writeFileSync(path.resolve(__dirname, '../client/contract.json'), contractData);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
