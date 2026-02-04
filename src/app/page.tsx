import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Financial copilot, powered by an on-chain token.
        </h1>
        <p className="max-w-2xl text-lg leading-7 text-zinc-600 dark:text-zinc-300">
          Salomon AI is a simple copilot UI with premium insights/actions gated by a Mint Club V2 token on
          Base (reserve: $OPENWORK).
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/token"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            Go to Token
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Open Copilot
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">1) Create / verify token</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Mint Club V2 (Base). Backed by $OPENWORK.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">2) Buy / Sell</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Mint / burn through the bond contract.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">3) Premium gating</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Unlock premium insights/actions when holding the token.
          </div>
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        Tip: start at <span className="font-mono">/token</span> to buy/sell SALOMON, then open the Copilot to unlock premium.
      </p>
    </div>
  );
}
