"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { formatUnits, isAddress, parseUnits } from "viem";

import {
  DEFAULT_OPENWORK_ADDRESS,
  MCV2_BOND_ADDRESS,
  ensureAllowance,
  mcv2BondAbi,
  readBalance,
  readCreationFee,
  readTokenMetadata,
  toTokenUnits,
} from "@/lib/mintclub";
import { getPublicClient, getWalletClient, SALOMON_TOKEN_ADDRESS } from "@/lib/web3";

const STORAGE_KEY = "salomon.tokenAddress";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function TokenPage() {
  const [account, setAccount] = useState<Address | null>(null);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [tokenAddressInput, setTokenAddressInput] = useState<string>(SALOMON_TOKEN_ADDRESS ?? "");
  const tokenAddress = useMemo(() => {
    if (!isAddress(tokenAddressInput)) return null;
    return tokenAddressInput as Address;
  }, [tokenAddressInput]);

  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null);
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);

  const [openworkDecimals, setOpenworkDecimals] = useState<number>(18);
  const [openworkBalance, setOpenworkBalance] = useState<string>("0");
  const [salomonBalance, setSalomonBalance] = useState<string>("0");

  const [creationFeeWei, setCreationFeeWei] = useState<bigint | null>(null);

  const [createName, setCreateName] = useState("Salomon AI");
  const [createSymbol, setCreateSymbol] = useState("SALOMON");
  const [createMaxSupply, setCreateMaxSupply] = useState("1000000");
  const [createPriceStart, setCreatePriceStart] = useState("0.01");
  const [createPriceEnd, setCreatePriceEnd] = useState("0.10");

  const [buyAmount, setBuyAmount] = useState("100");
  const [sellAmount, setSellAmount] = useState("50");

  async function refreshBalances(nextAccount?: Address | null, nextToken?: Address | null) {
    const a = nextAccount ?? account;
    const t = nextToken ?? tokenAddress;
    if (!a) return;

    try {
      const ow = await readBalance(DEFAULT_OPENWORK_ADDRESS, a);
      setOpenworkDecimals(ow.decimals);
      setOpenworkBalance(ow.formatted);

      if (t) {
        const sb = await readBalance(t, a);
        setSalomonBalance(sb.formatted);
      } else {
        setSalomonBalance("0");
      }
    } catch (e) {
      // ignore
    }
  }

  async function loadTokenMeta(addr: Address) {
    const meta = await readTokenMetadata(addr);
    setTokenDecimals(meta.decimals);
    setTokenSymbol(meta.symbol);
  }

  async function connect() {
    setStatus("");
    const walletClient = getWalletClient();
    if (!walletClient) {
      setStatus("No wallet found. Install/enable a wallet like MetaMask.");
      return;
    }

    try {
      const [a] = await walletClient.requestAddresses();
      setAccount(a);
      await refreshBalances(a, tokenAddress);
    } catch (e) {
      setStatus("Wallet connection rejected.");
    }
  }

  async function init() {
    const fee = await readCreationFee();
    setCreationFeeWei(fee);
  }

  async function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isAddress(saved)) setTokenAddressInput(saved);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    init();
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tokenAddress) {
      setTokenDecimals(null);
      setTokenSymbol(null);
      return;
    }

    loadTokenMeta(tokenAddress).catch(() => {
      setTokenDecimals(null);
      setTokenSymbol(null);
    });

    try {
      localStorage.setItem(STORAGE_KEY, tokenAddress);
    } catch {
      // ignore
    }

    if (account) refreshBalances(account, tokenAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress]);

  async function createToken() {
    if (!account) {
      setStatus("Connect wallet first.");
      return;
    }

    const walletClient = getWalletClient();
    const publicClient = getPublicClient();
    if (!walletClient) {
      setStatus("No wallet client.");
      return;
    }

    setBusy(true);
    setStatus("Creating token… (this requires an on-chain tx)");

    try {
      const fee = creationFeeWei ?? (await readCreationFee());

      // Curve design: 2 steps across total max supply
      // Step prices are in reserve token smallest units (OPENWORK has 18 decimals).
      const maxSupplyUnits = parseUnits(createMaxSupply, 18);
      const step1 = maxSupplyUnits / 10n;
      const step2 = maxSupplyUnits;

      const price1 = parseUnits(createPriceStart, 18);
      const price2 = parseUnits(createPriceEnd, 18);

      const hash = await walletClient.writeContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "createToken",
        args: [
          { name: createName, symbol: createSymbol },
          {
            mintRoyalty: 0,
            burnRoyalty: 0,
            reserveToken: DEFAULT_OPENWORK_ADDRESS,
            maxSupply: maxSupplyUnits as unknown as bigint, // uint128
            stepRanges: [step1, step2] as unknown as bigint[],
            stepPrices: [price1, price2] as unknown as bigint[],
          },
        ],
        account,
        value: fee,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      // Try to extract created token address from the return value (if supported) or logs.
      // viem doesn't automatically decode return values here; simplest is to ask user to paste the address from explorer.
      setStatus(
        `Token created tx confirmed: ${hash}. Now paste the token address (from the tx logs on BaseScan) into the field above.`
      );

      // refresh balances
      await refreshBalances(account, tokenAddress);

      // Keep receipt around in case we want to parse logs later.
      void receipt;
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    if (!account || !tokenAddress || tokenDecimals == null) {
      setStatus("Connect wallet + set token address first.");
      return;
    }

    setBusy(true);
    setStatus("Preparing buy…");

    try {
      const publicClient = getPublicClient();
      const walletClient = getWalletClient();
      if (!walletClient) throw new Error("No wallet client");

      const tokensToMint = toTokenUnits(buyAmount, tokenDecimals);
      const [reserveAmount] = await publicClient.readContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "getReserveForToken",
        args: [tokenAddress, tokensToMint],
      });

      setStatus(`Approving $OPENWORK…`);
      await ensureAllowance({
        token: DEFAULT_OPENWORK_ADDRESS,
        owner: account,
        spender: MCV2_BOND_ADDRESS,
        amount: reserveAmount,
      });

      // add a bit of slack to maxReserveAmount
      const maxReserve = (reserveAmount * 102n) / 100n;

      setStatus(`Minting…`);
      const hash = await walletClient.writeContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "mint",
        args: [tokenAddress, tokensToMint, maxReserve, account],
        account,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Buy complete: ${hash}`);
      await refreshBalances(account, tokenAddress);
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Buy failed");
    } finally {
      setBusy(false);
    }
  }

  async function sell() {
    if (!account || !tokenAddress || tokenDecimals == null) {
      setStatus("Connect wallet + set token address first.");
      return;
    }

    setBusy(true);
    setStatus("Preparing sell…");

    try {
      const publicClient = getPublicClient();
      const walletClient = getWalletClient();
      if (!walletClient) throw new Error("No wallet client");

      const tokensToBurn = toTokenUnits(sellAmount, tokenDecimals);
      const [refundAmount] = await publicClient.readContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "getRefundForTokens",
        args: [tokenAddress, tokensToBurn],
      });

      // 2% slippage floor
      const minRefund = (refundAmount * 98n) / 100n;

      setStatus("Burning…");
      const hash = await walletClient.writeContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "burn",
        args: [tokenAddress, tokensToBurn, minRefund, account],
        account,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Sell complete: ${hash}`);
      await refreshBalances(account, tokenAddress);
    } catch (e: any) {
      setStatus(e?.shortMessage ?? e?.message ?? "Sell failed");
    } finally {
      setBusy(false);
    }
  }

  const creationFeeFormatted = useMemo(() => {
    if (!creationFeeWei) return "…";
    // fee is in ETH (Base native)
    return formatUnits(creationFeeWei, 18);
  }, [creationFeeWei]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Token</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Mint Club V2 on Base (bond). Reserve token: $OPENWORK. Use this page to create (once) + buy/sell.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Wallet</div>
          {account ? (
            <span className="text-xs text-zinc-600 dark:text-zinc-300">Connected: {short(account)}</span>
          ) : (
            <span className="text-xs text-zinc-600 dark:text-zinc-300">Not connected</span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={connect}
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            disabled={busy}
          >
            {account ? "Reconnect" : "Connect wallet"}
          </button>
          <div className="text-xs text-zinc-500">
            Network: Base · Bond: <span className="font-mono">{short(MCV2_BOND_ADDRESS)}</span> · Creation fee: ~{creationFeeFormatted} ETH
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Token address</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Paste the Salomon token contract address (ERC-20) created on Mint Club.
          </p>
          <input
            value={tokenAddressInput}
            onChange={(e) => setTokenAddressInput(e.target.value.trim())}
            placeholder="0x…"
            className="mt-3 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
          />
          <div className="mt-2 text-xs text-zinc-500">
            {tokenAddress ? (
              <>Detected: {tokenSymbol ?? "?"} (decimals: {tokenDecimals ?? "?"})</>
            ) : (
              <>Enter a valid address</>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Balances</div>
          <div className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
            <div>
              $OPENWORK: <span className="font-mono">{openworkBalance}</span>
            </div>
            <div>
              {tokenSymbol ?? "SALOMON"}: <span className="font-mono">{salomonBalance}</span>
            </div>
          </div>
          <button
            onClick={() => refreshBalances()}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
            disabled={busy || !account}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Create token (one-time)</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Creates a new Mint Club token with a simple 2-step curve, using $OPENWORK as reserve.
          </p>

          <div className="mt-4 grid gap-2">
            <label className="text-xs text-zinc-500">Name</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-500">Symbol</label>
                <input
                  value={createSymbol}
                  onChange={(e) => setCreateSymbol(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Max supply</label>
                <input
                  value={createMaxSupply}
                  onChange={(e) => setCreateMaxSupply(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-500">Start price (OPENWORK)</label>
                <input
                  value={createPriceStart}
                  onChange={(e) => setCreatePriceStart(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">End price (OPENWORK)</label>
                <input
                  value={createPriceEnd}
                  onChange={(e) => setCreatePriceEnd(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
                />
              </div>
            </div>
          </div>

          <button
            onClick={createToken}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            disabled={busy || !account}
          >
            Create token
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Buy / Sell</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Buy mints tokens by spending $OPENWORK. Sell burns tokens and refunds $OPENWORK.
          </p>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-xs text-zinc-500">Buy amount ({tokenSymbol ?? "token"})</label>
              <input
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
              />
              <button
                onClick={buy}
                className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full border border-zinc-300 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                disabled={busy || !account || !tokenAddress}
              >
                Buy (mint)
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-500">Sell amount ({tokenSymbol ?? "token"})</label>
              <input
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-200"
              />
              <button
                onClick={sell}
                className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full border border-zinc-300 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                disabled={busy || !account || !tokenAddress}
              >
                Sell (burn)
              </button>
            </div>
          </div>
        </div>
      </div>

      {status ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          {status}
        </div>
      ) : null}

      <div className="text-xs text-zinc-500">
        Notes: This UI intentionally avoids leaking keys/tokens. On-chain actions require wallet signature.
      </div>
    </div>
  );
}
