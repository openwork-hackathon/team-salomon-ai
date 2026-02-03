export default function CopilotPage() {
  const hasPremium = false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Copilot</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Basic insights are free. Premium insights/actions require holding the Salomon token.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold">Free insight</div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          TODO: wire real data. For now, this is a placeholder.
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
            Connect wallet + hold token to unlock. (Gating wiring next.)
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Premium content goes here.
          </p>
        )}
      </div>
    </div>
  );
}
