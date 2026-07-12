"use client";

import { useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
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
            href="/analytics-print"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground cursor-pointer"
          >
            Export PDF
          </a>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Fuel Efficiency"
          value={avgFuelEfficiency.toFixed(2)}
          unit=" km/L"
        />
        <KpiCard
          label="Fleet Utilization"
          value={fleetUtilization.toFixed(1)}
          unit="%"
        />
        <KpiCard
          label="Operational Cost"
          value={`₹${totalOperationalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
        />
        <KpiCard
          label="Vehicle ROI"
          value={avgRoi.toFixed(2)}
          unit="%"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        ROI = (Revenue - Operational Cost) / Acquisition Cost × 100
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
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
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    className="font-mono text-[10px] text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    dx={-8}
                    className="font-mono text-[10px] text-muted-foreground"
                    tickFormatter={(val) => {
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
                      return `₹${val}`;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as { month: string; revenue: number };
                        return (
                          <div className="border border-border bg-card p-2 text-xs font-mono shadow-md select-none">
                            <p className="font-semibold text-foreground uppercase tracking-wide mb-1">{data.month}</p>
                            <p className="text-muted-foreground">
                              Revenue: <span className="text-foreground font-semibold">₹{data.revenue.toLocaleString("en-IN")}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                  />
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
                <div key={v.vehicleId} className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-foreground">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground mr-1.5">{v.regNo}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="ml-1.5">{v.name}</span>
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      ₹{v.operationalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted border border-border/10">
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
