import { task } from "hardhat/config";

import optimismConfig from "./constants/optimismConfig";
import testOptimismConfig from "./constants/testOptimismConfig";

import fantomConfig from "./constants/fantomConfig";
import testFantomConfig from "./constants/testFantomConfig";

task("deploy:op", "Deploys Optimism contracts").setAction(async function (
  taskArguments,
  { ethers }
) {
  const mainnet = false;

  const OP_CONFIG = mainnet ? optimismConfig : testOptimismConfig;
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
    ethers.getContractFactory("Velo"),
    ethers.getContractFactory("GaugeFactory"),
    ethers.getContractFactory("BribeFactory"),
    ethers.getContractFactory("PairFactory"),
    ethers.getContractFactory("Router"),
    ethers.getContractFactory("VelodromeLibrary"),
    ethers.getContractFactory("VeArtProxy"),
    ethers.getContractFactory("VotingEscrow"),
    ethers.getContractFactory("RewardsDistributor"),
    ethers.getContractFactory("Voter"),
    ethers.getContractFactory("Minter"),
    ethers.getContractFactory("VeloGovernor"),
    ethers.getContractFactory("RedemptionReceiver"),
    ethers.getContractFactory("MerkleClaim"),
  ]);

  const velo = await Velo.deploy();
  await velo.deployed();
  console.log("Velo deployed to: ", velo.address);

  const gaugeFactory = await GaugeFactory.deploy();
  await gaugeFactory.deployed();
  console.log("GaugeFactory deployed to: ", gaugeFactory.address);

  const bribeFactory = await BribeFactory.deploy();
  await bribeFactory.deployed();
  console.log("BribeFactory deployed to: ", bribeFactory.address);

  const pairFactory = await PairFactory.deploy();
  await pairFactory.deployed();
  console.log("PairFactory deployed to: ", pairFactory.address);

  const router = await Router.deploy(pairFactory.address, OP_CONFIG.WETH);
  await router.deployed();
  console.log("Router deployed to: ", router.address);
  console.log("Args: ", pairFactory.address, OP_CONFIG.WETH, "\n");

  const library = await Library.deploy(router.address);
  await library.deployed();
  console.log("VelodromeLibrary deployed to: ", library.address);
  console.log("Args: ", router.address, "\n");

  const artProxy = await VeArtProxy.deploy();
  await artProxy.deployed();
  console.log("VeArtProxy deployed to: ", artProxy.address);

  const escrow = await VotingEscrow.deploy(velo.address, artProxy.address);
  await escrow.deployed();
  console.log("VotingEscrow deployed to: ", escrow.address);
  console.log("Args: ", velo.address, artProxy.address, "\n");

  const distributor = await RewardsDistributor.deploy(escrow.address);
  await distributor.deployed();
  console.log("RewardsDistributor deployed to: ", distributor.address);
  console.log("Args: ", escrow.address, "\n");

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

  const receiver = await RedemptionReceiver.deploy(
    OP_CONFIG.USDC,
    velo.address,
    FTM_CONFIG.lzChainId,
    OP_CONFIG.lzEndpoint,
  );
  await receiver.deployed();
  console.log("RedemptionReceiver deployed to: ", receiver.address);
  console.log("Args: ", 
    OP_CONFIG.USDC,
    velo.address,
    FTM_CONFIG.lzChainId,
    OP_CONFIG.lzEndpoint,
    "\n"
  );

  const governor = await VeloGovernor.deploy(escrow.address);
  await governor.deployed();
  console.log("VeloGovernor deployed to: ", governor.address);
  console.log("Args: ", escrow.address, "\n");

  // Airdrop
  // convert OP_CONFIG.merkleRoot to bytes32
  const merkleRootBytes32 = ethers.utils.formatBytes32String(OP_CONFIG.merkleRoot);
  const claim = await MerkleClaim.deploy(velo.address, merkleRootBytes32);
  await claim.deployed();
  console.log("MerkleClaim deployed to: ", claim.address);
  console.log("Args: ", velo.address, OP_CONFIG.merkleRoot, "\n");

  // Initialize
  const initialMint = await velo.initialMint(OP_CONFIG.teamEOA);
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

  const setPauser = await pairFactory.setPauser(OP_CONFIG.teamMultisig);
  await setPauser.wait();
  console.log("Pauser set");

  const setVoter = await escrow.setVoter(voter.address);
  await setVoter.wait();
  console.log("Voter set");

  const setTeam = await escrow.setTeam(OP_CONFIG.teamMultisig);
  await setTeam.wait();
  console.log("Team set for escrow");

  const setGov = await voter.setGovernor(OP_CONFIG.teamMultisig);
  await setGov.wait();
  console.log("Governor set");

  const setEC = await voter.setEmergencyCouncil(OP_CONFIG.teamMultisig);
  await setEC.wait();
  console.log("Emergency Council set");

  const setDepositer = await distributor.setDepositor(minter.address);
  await setDepositer.wait();
  console.log("Depositor set");

  const setReceiverTeam = await receiver.setTeam(OP_CONFIG.teamMultisig);
  await setReceiverTeam.wait();
  console.log("Team set for receiver");

  const setGovTeam = await governor.setTeam(OP_CONFIG.teamMultisig);
  await setGovTeam.wait();
  console.log("Team set for governor");

  // Whitelist
  const nativeToken = [velo.address];
  const tokenWhitelist = nativeToken.concat(OP_CONFIG.tokenWhitelist);
  const voterInit = await voter.initialize(tokenWhitelist, minter.address);
  await voterInit.wait();
  console.log("Whitelist set");

  // Initial veVELO distro
  const mintInit = await minter.initialize(
    OP_CONFIG.partnerAddrs,
    OP_CONFIG.partnerAmts,
    OP_CONFIG.partnerMax
  );
  await mintInit.wait();
  console.log("veVELO distributed");

  const setMintTeam = await minter.setTeam(OP_CONFIG.teamMultisig);
  await setMintTeam.wait();
  console.log("Team set for minter");

  console.log("Optimism contracts deployed");
});
