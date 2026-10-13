import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { arcMainnet } from "./arc";

export const wagmiConfig = createConfig({
  chains: [arcMainnet],
  connectors: [injected()],
  transports: {
    [arcMainnet.id]: http(),
  },
  ssr: true,
});
