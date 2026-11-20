export function ApprovalGauge({
  approvedCount,
  itemLabel,
  totalCount,
}: {
  approvedCount: number;
  itemLabel: string;
  totalCount: number;
}) {
  const approvalRate =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const circumference = 2 * Math.PI * 44;

  return (
    <div
      aria-label={`${approvedCount} of ${totalCount} ${itemLabel} approved, ${approvalRate}% approval rate`}
      className="relative mx-auto flex size-36 items-center justify-center"
      role="img"
    >
      <svg aria-hidden="true" className="-rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          fill="none"
          r="44"
          stroke="#f0ece4"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          fill="none"
          r="44"
          stroke="#5e9a62"
          strokeDasharray={`${(approvalRate / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="10"
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-[#172a21]">
          {approvalRate}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          approved
        </span>
      </span>
    </div>
  );
}
