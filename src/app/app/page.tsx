"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";

import { readBalance } from "@/lib/mintclub";
import { SALOMON_TOKEN_ADDRESS } from "@/lib/web3";

const STORAGE_KEY = "salomon.tokenAddress";

export default function CopilotPage() {
  const [account, setAccount] = useState<Address | null>(null);
  const [tokenAddress, setTokenAddress] = useState<Address | null>(SALOMON_TOKEN_ADDRESS ?? null);
  const [tokenSymbol, setTokenSymbol] = useState<string>("SALOMON");
  const [balance, setBalance] = useState<bigint>(0n);
  const [status, setStatus] = useState<string>("");

  const hasPremium = useMemo(() => balance > 0n, [balance]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isAddress(saved)) setTokenAddress(saved as Address);
    } catch {
      // ignore
    }
  }, []);

  async function connect() {
    setStatus("");
    const ethereum = (window as any)?.ethereum;
    if (!ethereum) {
      setStatus("No wallet found. Install/enable MetaMask.");
      return;
    }

    try {
      const [a] = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(a as Address);
    } catch {
      setStatus("Wallet connection rejected.");
    }
  }

  async function refresh() {
    if (!account || !tokenAddress) return;

    try {
      const b = await readBalance(tokenAddress, account);
      setTokenSymbol(b.symbol);
      setBalance(b.raw);
    } catch {
      setBalance(0n);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tokenAddress]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Copilot</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Basic insights are free. Premium insights/actions require holding the Salomon token.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Wallet</div>
          <div className="text-xs text-zinc-500">
            {account ? `Connected: ${account.slice(0, 6)}…${account.slice(-4)}` : "Not connected"}
          </div>
          {!tokenAddress ? (
            <div className="text-xs text-zinc-500">Set the token address on /token first.</div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            onClick={connect}
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            {account ? "Reconnect" : "Connect"}
          </button>
          <button
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
            disabled={!account || !tokenAddress}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold">Free insight</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Spending trend: you’re heavy on "subscriptions" this month. Consider consolidating.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Premium insight</div>
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {hasPremium ? "Unlocked" : "Locked"}
          </span>
        </div>

        {!hasPremium ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            To unlock: connect wallet and hold at least 1 {tokenSymbol}. Buy on the Token page.
          </p>
        ) : (
          <div className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              You have premium access. Next best action: rebalance cash buffer to 3 months of burn.
            </p>
            <p>
              Optional: enable auto-alerts when a category exceeds budget by 15%.
            </p>
          </div>
        )}
      </div>

      {status ? <div className="text-sm text-amber-700 dark:text-amber-300">{status}</div> : null}
    </div>
  );
}
