"use client";

import { useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
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
    () =>
      [...vehicles]
        .sort((a, b) => b.operationalCost - a.operationalCost)
        .slice(0, 5),
    [vehicles],
  );

  const maxCost = topCostliest.length > 0 ? topCostliest[0].operationalCost : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Fleet-wide performance metrics, costs, and revenue analysis."
        actions={
          <Button asChild variant="outline">
            <a href="/api/analytics/export" download>
              Export CSV
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Fuel Efficiency"
          value={avgFuelEfficiency.toFixed(2)}
          unit=" km/L"
          accentClassName="border-l-2 border-l-chart-2"
        />
        <KpiCard
          label="Fleet Utilization"
          value={fleetUtilization.toFixed(1)}
          unit="%"
          accentClassName="border-l-2 border-l-primary"
        />
        <KpiCard
          label="Operational Cost"
          value={`₹${totalOperationalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          accentClassName="border-l-2 border-l-chart-3"
        />
        <KpiCard
          label="Vehicle ROI"
          value={avgRoi.toFixed(2)}
          unit="%"
          accentClassName="border-l-2 border-l-chart-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-4">
          <h2 className="mb-4 text-base font-semibold">Monthly Revenue</h2>
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
                <BarChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 0,
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                    }}
                    formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="border border-border bg-card p-4">
          <h2 className="mb-4 text-base font-semibold">Top Costliest Vehicles</h2>
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
              {topCostliest.map((v, i) => (
                <div key={v.vehicleId} className="flex items-center gap-3">
                  <span className="w-8 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {v.regNo} — {v.name}
                      </span>
                      <span className="font-mono">₹{v.operationalCost.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-1 h-2 w-full bg-muted">
                      <div
                        className="h-full bg-chart-3"
                        style={{ width: `${(v.operationalCost / maxCost) * 100}%` }}
                      />
                    </div>
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
