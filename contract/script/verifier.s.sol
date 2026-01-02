// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Groth16Verifier} from "../src/Verifier.sol";

contract DeployVerifier is Script {
    function run() external returns (Groth16Verifier) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        Groth16Verifier verifier = new Groth16Verifier();

        console.log("Groth16Verifier deployed at:", address(verifier));

        vm.stopBroadcast();

        return verifier;
    }
}
