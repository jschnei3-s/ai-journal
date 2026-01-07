"use client";

import { Progress } from "./Progress";

interface UsageMeterProps {
  current: number;
  limit: number;
  label?: string;
}

export function UsageMeter({ current, limit, label }: UsageMeterProps) {
  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 font-medium">{label}</span>
          <span
            className={`font-semibold ${
              isAtLimit
                ? "text-red-600"
                : isNearLimit
                ? "text-yellow-600"
                : "text-gray-600"
            }`}
          >
            {current} / {limit}
          </span>
        </div>
      )}
      <Progress value={percentage} isNearLimit={isNearLimit} isAtLimit={isAtLimit} />
      {isAtLimit && (
        <p className="text-xs text-red-600">
          You&apos;ve reached your limit. Upgrade to continue using AI prompts.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-yellow-600">
          You&apos;re approaching your limit. Consider upgrading for unlimited prompts.
        </p>
      )}
    </div>
  );
}



