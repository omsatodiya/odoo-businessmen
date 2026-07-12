"use client";

import { useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

import { PageHeader } from "@/components/shared/page-header";
import { useAnalyticsStore } from "@/store/analytics-slice";

export default function AnalyticsPage() {
  const { vehicles, monthlyRevenue, fleetUtilization, loading, fetch } = useAnalyticsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const avgFuelEfficiency = useMemo(() => {
    const withData = vehicles.filter((v) => v.fuelEfficiencyKmPerL !== null);
    if (withData.length === 0) return 0;
    return withData.reduce((sum, v) => sum + v.fuelEfficiencyKmPerL!, 0) / withData.length;
  }, [vehicles]);

  const totalOperationalCost = useMemo(
    () => vehicles.reduce((sum, v) => sum + v.operationalCost, 0),
    [vehicles],
  );

  const avgRoi = useMemo(() => {
    const withData = vehicles.filter((v) => v.roiPercent !== null);
    if (withData.length === 0) return 0;
    return withData.reduce((sum, v) => sum + v.roiPercent!, 0) / withData.length;
  }, [vehicles]);

  const topCostliest = useMemo(
    () => [...vehicles].sort((a, b) => b.operationalCost - a.operationalCost).slice(0, 5),
    [vehicles],
  );

  const maxCost = topCostliest.length > 0 ? topCostliest[0].operationalCost : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports &amp; Analytics"
        description="Fleet-wide performance metrics, costs, and revenue analysis."
        actions={
          <a
            href="/api/analytics/export"
            download
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Export CSV
          </a>
        }
      />

      <div className="flex gap-4">
        <div className="flex-1 border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Fuel Efficiency
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
            {avgFuelEfficiency.toFixed(2)}
            <span className="text-lg text-muted-foreground"> km/L</span>
          </p>
        </div>
        <div className="flex-1 border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Fleet Utilization
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
            {fleetUtilization.toFixed(1)}
            <span className="text-lg text-muted-foreground">%</span>
          </p>
        </div>
        <div className="flex-1 border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Operational Cost
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
            ₹{totalOperationalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="flex-1 border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Vehicle ROI
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-foreground">
            {avgRoi.toFixed(2)}
            <span className="text-lg text-muted-foreground">%</span>
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        ROI = (Revenue - Operational Cost) / Acquisition Cost × 100
      </p>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        <div className="border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Monthly Revenue</h2>
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : monthlyRevenue.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No revenue data yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold">Top Costliest Vehicles</h2>
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : topCostliest.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No vehicle cost data yet.
            </div>
          ) : (
            <div className="space-y-4">
              {topCostliest.map((v) => (
                <div key={v.vehicleId} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {v.regNo} — {v.name}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted">
                    <div
                      className="h-full bg-chart-3"
                      style={{ width: `${(v.operationalCost / maxCost) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
