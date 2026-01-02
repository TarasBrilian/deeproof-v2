import { createConfig } from "ponder";
import { mantle } from "viem/chains";

import { VerifierAbi } from "./abis/VerifierAbi.ts";

export default createConfig({
  chains: {
    mantle: {
      id: 5000,
      rpc: process.env.PONDER_RPC_URL_2!,
    },
  },
  contracts: {
    Verifier: {
      chain: "mantle",
      abi: VerifierAbi,
      address: "0x21a3Cfdeb67f06C9353E43306c5E34f2C2E905e3",
      startBlock: 32900807,
    },
  },
});
