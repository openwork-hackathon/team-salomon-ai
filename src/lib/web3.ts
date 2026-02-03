import { createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits } from "viem";
import { base } from "viem/chains";

export const BASE_CHAIN = base;

export const BASE_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "https://mainnet.base.org";

export const SALOMON_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SALOMON_TOKEN_ADDRESS as
  | `0x${string}`
  | undefined;

export const OPENWORK_ADDRESS = process.env.NEXT_PUBLIC_OPENWORK_ADDRESS as
  | `0x${string}`
  | undefined;

export function getPublicClient() {
  return createPublicClient({
    chain: BASE_CHAIN,
    transport: http(BASE_RPC_URL),
  });
}

export function getWalletClient() {
  if (typeof window === "undefined") return null;
  const anyWindow = window as unknown as { ethereum?: import("viem").EIP1193Provider };
  if (!anyWindow.ethereum) return null;

  return createWalletClient({
    chain: BASE_CHAIN,
    transport: custom(anyWindow.ethereum),
  });
}

export const erc20Abi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export async function readErc20Balance({
  token,
  account,
}: {
  token: `0x${string}`;
  account: `0x${string}`;
}) {
  const client = getPublicClient();

  const [decimals, symbol, raw] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
    client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
    client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account],
    }),
  ]);

  return {
    decimals,
    symbol,
    raw,
    formatted: formatUnits(raw, decimals),
  };
}

export function toUnits(value: string, decimals: number) {
  return parseUnits(value, decimals);
}
