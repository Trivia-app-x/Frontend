import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";
import { http } from "wagmi";

export const config = getDefaultConfig({
  appName: "Trivia Chain",
  projectId:
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "trivia-chain-app",
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(
      "https://arb-sepolia.g.alchemy.com/v2/77lutS0hhE-NpghexIO8aUO8_qCMtShL",
      {
        batch: true, // Enable batching
      }
    ),
  },
  ssr: false,
});

// import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { http } from 'wagmi';
// import { mainnet, sepolia } from 'wagmi/chains';
// const config = getDefaultConfig({
//   appName: 'My RainbowKit App',
//   projectId: 'YOUR_PROJECT_ID',
//   chains: [mainnet, sepolia],
//   transports: {
//     [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/...'),
//     [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/...'),
//   },
// });
