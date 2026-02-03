export default function TokenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Token</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Mint Club V2 on Base. Reserve token: $OPENWORK. This page will let you create the token (once)
          and run buy/sell (mint/burn).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Create token (one-time)</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            TODO: integrate Mint Club V2 factory + token params.
          </div>
          <button
            disabled
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white opacity-60 dark:bg-zinc-50 dark:text-black"
          >
            Create (soon)
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm font-semibold">Buy / Sell</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            TODO: approve $OPENWORK + mint/burn via MCV2_Bond.
          </div>
          <div className="mt-4 grid gap-2">
            <button
              disabled
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium opacity-60 dark:border-zinc-700"
            >
              Buy (soon)
            </button>
            <button
              disabled
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium opacity-60 dark:border-zinc-700"
            >
              Sell (soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
