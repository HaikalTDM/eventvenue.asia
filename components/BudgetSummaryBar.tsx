"use client";

interface BudgetSummaryBarProps {
  totalEstimate: number;
  currency: string;
  budgetUtilization: number | null;
  venueCost: number;
  serviceBreakdown: { category: string; cost: number }[];
}

export default function BudgetSummaryBar({
  totalEstimate,
  currency,
  budgetUtilization,
  venueCost,
  serviceBreakdown,
}: BudgetSummaryBarProps) {
  const isOverBudget = budgetUtilization !== null && budgetUtilization > 100;
  const displayUtilization = budgetUtilization !== null ? Math.min(budgetUtilization, 100) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Budget Summary</h3>
        <span className="text-lg font-bold text-gray-900">
          {currency} {totalEstimate.toLocaleString()}
        </span>
      </div>

      {budgetUtilization !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500">Budget utilization</span>
            <span className={isOverBudget ? "text-[#EB4D4B] font-semibold" : "text-gray-700 font-semibold"}>
              {Math.round(budgetUtilization)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOverBudget ? "bg-[#EB4D4B]" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
          {isOverBudget && (
            <p className="mt-1.5 text-xs text-[#EB4D4B] font-medium">
              {Math.round(budgetUtilization - 100)}% over budget
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <span>
          <span className="font-medium text-gray-700">Venue:</span> {currency} {venueCost.toLocaleString()}
        </span>
        {serviceBreakdown.map((s) => (
          <span key={s.category}>
            <span className="font-medium text-gray-700 capitalize">{s.category.replace(/_/g, " ")}:</span>{" "}
            {currency} {s.cost.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}
