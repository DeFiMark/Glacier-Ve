import { task, subtask } from "hardhat/config";

import avalancheConfig from "./constants/avalancheConfig";
import testAvalanceConfig from "./constants/testAvalancheConfig";

import fantomConfig from "./constants/fantomConfig";
import testFantomConfig from "./constants/testFantomConfig";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

task("deploy:avax", "Deploys Avalanche contracts").setAction(async function (
  taskArguments,
  hre
) {
  const mainnet = false;

  const AVAX_CONFIG = mainnet ? avalancheConfig : testAvalanceConfig;
  const FTM_CONFIG = mainnet ? fantomConfig : testFantomConfig;

  // Load
  const [
    Velo,
    GaugeFactory,
    BribeFactory,
    PairFactory,
    Router,
    Library,
    VeArtProxy,
    VotingEscrow,
    RewardsDistributor,
    Voter,
    Minter,
    VeloGovernor,
    RedemptionReceiver,
    MerkleClaim,
  ] = await Promise.all([
    hre.ethers.getContractFactory("Velo"),
    hre.ethers.getContractFactory("GaugeFactory"),
    hre.ethers.getContractFactory("BribeFactory"),
    hre.ethers.getContractFactory("PairFactory"),
    hre.ethers.getContractFactory("Router"),
    hre.ethers.getContractFactory("VelodromeLibrary"),
    hre.ethers.getContractFactory("VeArtProxy"),
    hre.ethers.getContractFactory("VotingEscrow"),
    hre.ethers.getContractFactory("RewardsDistributor"),
    hre.ethers.getContractFactory("Voter"),
    hre.ethers.getContractFactory("Minter"),
    hre.ethers.getContractFactory("VeloGovernor"),
    hre.ethers.getContractFactory("RedemptionReceiver"),
    hre.ethers.getContractFactory("MerkleClaim"),
  ]);

  type ContractToVerify = {
    name: string;
    address: string;
    args: any[];
  };
  const contractsToVerify: ContractToVerify[] = [];

  const velo = await Velo.deploy();
  await velo.deployed();
  console.log("Velo deployed to: ", velo.address);
  contractsToVerify.push({
    name: "Velo",
    address: velo.address,
    args: [],
  });

  const gaugeFactory = await GaugeFactory.deploy();
  await gaugeFactory.deployed();
  console.log("GaugeFactory deployed to: ", gaugeFactory.address);
  contractsToVerify.push({
    name: "GaugeFactory",
    address: gaugeFactory.address,
    args: [],
  });

  const bribeFactory = await BribeFactory.deploy();
  await bribeFactory.deployed();
  console.log("BribeFactory deployed to: ", bribeFactory.address);
  contractsToVerify.push({
    name: "BribeFactory",
    address: bribeFactory.address,
    args: [],
  });

  const pairFactory = await PairFactory.deploy();
  await pairFactory.deployed();
  console.log("PairFactory deployed to: ", pairFactory.address);
  contractsToVerify.push({
    name: "PairFactory",
    address: pairFactory.address,
    args: [],
  });

  const router = await Router.deploy(pairFactory.address, AVAX_CONFIG.WETH);
  await router.deployed();
  console.log("Router deployed to: ", router.address);
  console.log("Args: ", pairFactory.address, AVAX_CONFIG.WETH, "\n");
  contractsToVerify.push({
    name: "Router",
    address: router.address,
    args: [pairFactory.address, AVAX_CONFIG.WETH],
  });

  const library = await Library.deploy(router.address);
  await library.deployed();
  console.log("VelodromeLibrary deployed to: ", library.address);
  console.log("Args: ", router.address, "\n");
  contractsToVerify.push({
    name: "VelodromeLibrary",
    address: library.address,
    args: [router.address],
  });

  const artProxy = await VeArtProxy.deploy();
  await artProxy.deployed();
  console.log("VeArtProxy deployed to: ", artProxy.address);
  contractsToVerify.push({
    name: "VeArtProxy",
    address: artProxy.address,
    args: [],
  });

  const escrow = await VotingEscrow.deploy(velo.address, artProxy.address);
  await escrow.deployed();
  console.log("VotingEscrow deployed to: ", escrow.address);
  console.log("Args: ", velo.address, artProxy.address, "\n");
  contractsToVerify.push({
    name: "VotingEscrow",
    address: escrow.address,
    args: [velo.address, artProxy.address],
  });

  const distributor = await RewardsDistributor.deploy(escrow.address);
  await distributor.deployed();
  console.log("RewardsDistributor deployed to: ", distributor.address);
  console.log("Args: ", escrow.address, "\n");
  contractsToVerify.push({
    name: "RewardsDistributor",
    address: distributor.address,
    args: [escrow.address],
  });

  const voter = await Voter.deploy(
    escrow.address,
    pairFactory.address,
    gaugeFactory.address,
    bribeFactory.address
  );
  await voter.deployed();
  console.log("Voter deployed to: ", voter.address);
  console.log("Args: ", 
    escrow.address,
    pairFactory.address,
    gaugeFactory.address,
    bribeFactory.address,
    "\n"
  );
  contractsToVerify.push({
    name: "Voter",
    address: voter.address,
    args: [
      escrow.address,
      pairFactory.address,
      gaugeFactory.address,
      bribeFactory.address,
    ],
  });

  const minter = await Minter.deploy(
    voter.address,
    escrow.address,
    distributor.address
  );
  await minter.deployed();
  console.log("Minter deployed to: ", minter.address);
  console.log("Args: ", 
    voter.address,
    escrow.address,
    distributor.address,
    "\n"
  );
  contractsToVerify.push({
    name: "Minter",
    address: minter.address,
    args: [
      voter.address,
      escrow.address,
      distributor.address,
    ],
  });

  const receiver = await RedemptionReceiver.deploy(
    AVAX_CONFIG.USDC,
    velo.address,
    FTM_CONFIG.lzChainId,
    AVAX_CONFIG.lzEndpoint,
  );
  await receiver.deployed();
  console.log("RedemptionReceiver deployed to: ", receiver.address);
  console.log("Args: ", 
    AVAX_CONFIG.USDC,
    velo.address,
    FTM_CONFIG.lzChainId,
    AVAX_CONFIG.lzEndpoint,
    "\n"
  );
  contractsToVerify.push({
    name: "RedemptionReceiver",
    address: receiver.address,
    args: [
      AVAX_CONFIG.USDC,
      velo.address,
      FTM_CONFIG.lzChainId,
      AVAX_CONFIG.lzEndpoint,
    ],
  });

  const governor = await VeloGovernor.deploy(escrow.address);
  await governor.deployed();
  console.log("VeloGovernor deployed to: ", governor.address);
  console.log("Args: ", escrow.address, "\n");
  contractsToVerify.push({
    name: "VeloGovernor",
    address: governor.address,
    args: [escrow.address],
  });

  // Airdrop
  // convert AVAX_CONFIG.merkleRoot to bytes32
  const merkleRootBytes32 = hre.ethers.utils.formatBytes32String(AVAX_CONFIG.merkleRoot);
  const claim = await MerkleClaim.deploy(velo.address, merkleRootBytes32);
  await claim.deployed();
  console.log("MerkleClaim deployed to: ", claim.address);
  console.log("Args: ", velo.address, AVAX_CONFIG.merkleRoot, "\n");
  contractsToVerify.push({
    name: "MerkleClaim",
    address: claim.address,
    args: [velo.address, merkleRootBytes32],
  });

  // verify each contract before initialization
  // for (let i = 0; i < contractsToVerify.length; i++) {
  //   const contract = contractsToVerify[i];
  //   console.log(`Verifying ${contract.name}: ${contract.address}`);
  //   try {
  //     await hre.run("verify:verify", { 
  //       address: contract.address,
  //       constructorArguments: contract.args,
  //     });
  //   } catch (e) {
  //     console.log("Error verifying", e);
  //   }
  // }

  // Initialize
  const initialMint = await velo.initialMint(AVAX_CONFIG.teamEOA);
  await initialMint.wait();
  console.log("Initial minted");

  const setRedemptionReceiver = await velo.setRedemptionReceiver(receiver.address);
  await setRedemptionReceiver.wait();
  console.log("RedemptionReceiver set");

  const setMerkleClaim = await velo.setMerkleClaim(claim.address);
  await setMerkleClaim.wait();
  console.log("MerkleClaim set");

  const setMinter = await velo.setMinter(minter.address);
  await setMinter.wait();
  console.log("Minter set");

  const setPauser = await pairFactory.setPauser(AVAX_CONFIG.teamMultisig);
  await setPauser.wait();
  console.log("Pauser set");

  const setVoter = await escrow.setVoter(voter.address);
  await setVoter.wait();
  console.log("Voter set");

  const setTeam = await escrow.setTeam(AVAX_CONFIG.teamMultisig);
  await setTeam.wait();
  console.log("Team set for escrow");

  const setGov = await voter.setGovernor(AVAX_CONFIG.teamMultisig);
  await setGov.wait();
  console.log("Governor set");

  const setEC = await voter.setEmergencyCouncil(AVAX_CONFIG.teamMultisig);
  await setEC.wait();
  console.log("Emergency Council set");

  const setDepositer = await distributor.setDepositor(minter.address);
  await setDepositer.wait();
  console.log("Depositor set");

  const setReceiverTeam = await receiver.setTeam(AVAX_CONFIG.teamMultisig);
  await setReceiverTeam.wait();
  console.log("Team set for receiver");

  const setGovTeam = await governor.setTeam(AVAX_CONFIG.teamMultisig);
  await setGovTeam.wait();
  console.log("Team set for governor");

  // Whitelist
  const nativeToken = [velo.address];
  const tokenWhitelist = nativeToken.concat(AVAX_CONFIG.tokenWhitelist);
  const voterInit = await voter.initialize(tokenWhitelist, minter.address);
  await voterInit.wait();
  console.log("Whitelist set");

  // Initial veVELO distro
  const mintInit = await minter.initialize(
    AVAX_CONFIG.partnerAddrs,
    AVAX_CONFIG.partnerAmts,
    AVAX_CONFIG.partnerMax
  );
  await mintInit.wait();
  console.log("veVELO distributed");

  const setMintTeam = await minter.setTeam(AVAX_CONFIG.teamMultisig);
  await setMintTeam.wait();
  console.log("Team set for minter");

  console.log("Avalanche contracts deployed and verified");
  console.table(contractsToVerify.map((c) => {
    return {
      name: c.name,
      address: c.address,
    }
  }));
});