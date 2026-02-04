import { formatUnits, parseUnits, type Address } from "viem";
import { getPublicClient, getWalletClient, erc20Abi } from "./web3";

export const MCV2_BOND_ADDRESS = (process.env.NEXT_PUBLIC_MCV2_BOND_ADDRESS ??
  "0xc5a076cad94176c2996B32d8466Be1cE757FAa27") as Address;

export const DEFAULT_OPENWORK_ADDRESS = (process.env.NEXT_PUBLIC_OPENWORK_ADDRESS ??
  "0x299c30DD5974BF4D5bFE42C340CA40462816AB07") as Address;

export const mcv2BondAbi = [
  {
    type: "function",
    name: "creationFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getSteps",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "rangeTo", type: "uint128" },
          { name: "price", type: "uint128" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "maxSupply",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint128" }],
  },
  {
    type: "function",
    name: "priceForNextMint",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint128" }],
  },
  {
    type: "function",
    name: "getReserveForToken",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensToMint", type: "uint256" },
    ],
    outputs: [
      { name: "reserveAmount", type: "uint256" },
      { name: "royalty", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getRefundForTokens",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensToBurn", type: "uint256" },
    ],
    outputs: [
      { name: "refundAmount", type: "uint256" },
      { name: "royalty", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensToMint", type: "uint256" },
      { name: "maxReserveAmount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensToBurn", type: "uint256" },
      { name: "minRefund", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "createToken",
    stateMutability: "payable",
    inputs: [
      {
        name: "tp",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
        ],
      },
      {
        name: "bp",
        type: "tuple",
        components: [
          { name: "mintRoyalty", type: "uint16" },
          { name: "burnRoyalty", type: "uint16" },
          { name: "reserveToken", type: "address" },
          { name: "maxSupply", type: "uint128" },
          { name: "stepRanges", type: "uint128[]" },
          { name: "stepPrices", type: "uint128[]" },
        ],
      },
    ],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export async function readCreationFee() {
  const client = getPublicClient();
  return client.readContract({
    address: MCV2_BOND_ADDRESS,
    abi: mcv2BondAbi,
    functionName: "creationFee",
  });
}

export async function readTokenMetadata(token: Address) {
  const client = getPublicClient();
  const [decimals, symbol] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
    client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
  ]);
  return { decimals, symbol };
}

export async function readBalance(token: Address, account: Address) {
  const client = getPublicClient();
  const [decimals, symbol, raw] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
    client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
    client.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
  ]);
  return { decimals, symbol, raw, formatted: formatUnits(raw, decimals) };
}

export async function ensureAllowance({
  token,
  owner,
  spender,
  amount,
}: {
  token: Address;
  owner: Address;
  spender: Address;
  amount: bigint;
}) {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error("No wallet available");

  const current = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
  });

  if (current >= amount) return { approved: false as const, txHash: null as `0x${string}` | null };

  const hash = await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
    account: owner,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { approved: true as const, txHash: hash };
}

export function toTokenUnits(amount: string, decimals: number) {
  return parseUnits(amount || "0", decimals);
}
