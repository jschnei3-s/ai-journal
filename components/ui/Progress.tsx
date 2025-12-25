interface ProgressProps {
  value: number;
  isNearLimit?: boolean;
  isAtLimit?: boolean;
}

export function Progress({ value, isNearLimit, isAtLimit }: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  const bgColor = isAtLimit
    ? "bg-red-600"
    : isNearLimit
    ? "bg-yellow-500"
    : "bg-blue-600";

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${bgColor}`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

