"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Printer, ArrowLeft, BarChart3, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleAnalytics {
  vehicleId: string;
  regNo: string;
  name: string;
  distanceKm: number;
  fuelLiters: number;
  fuelEfficiencyKmPerL: number | null;
  operationalCost: number;
  revenue: number;
  roiPercent: number | null;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface AnalyticsData {
  vehicles: VehicleAnalytics[];
  monthlyRevenue: MonthlyRevenue[];
  fleetUtilization: number;
}

export default function AnalyticsPrintPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load analytics print report", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics
  const vehicles = data?.vehicles || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const fleetUtilization = data?.fleetUtilization || 0;

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

  // Auto trigger browser print dialog after data is loaded and rendered
  useEffect(() => {
    if (!loading && data) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground font-mono">Generating Print Preview...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 sm:p-10 text-black font-sans print:p-0 print:[color-adjust:exact]">
      {/* Print Controls Header - Hidden on Print */}
      <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.close()} className="gap-1.5 h-8 text-xs cursor-pointer">
          <ArrowLeft className="size-3.5" />
          Close Tab
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 h-8 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
            <Printer className="size-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Report Document Wrapper */}
      <div className="space-y-8">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">TransitOps Operations</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Depot: Gandhinagar Depot GJ-14</p>
            <p className="text-xs text-zinc-500 font-mono">Date Generated: {format(new Date(), "dd MMMM yyyy HH:mm")}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-primary">PERFORMANCE & ROI REPORT</h2>
            <p className="text-xs text-zinc-600 font-semibold bg-zinc-100 px-2 py-1 inline-block mt-1 uppercase font-mono">
              Fleet-Wide Analytics
            </p>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-4 gap-4 border border-zinc-200 bg-zinc-50/50 p-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Fuel Efficiency</span>
            <p className="text-lg font-bold font-mono">
              {avgFuelEfficiency.toFixed(2)} <span className="text-xs font-normal text-zinc-500">km/L</span>
            </p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Fleet Utilization</span>
            <p className="text-lg font-bold font-mono">{fleetUtilization.toFixed(1)}%</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Operational Cost</span>
            <p className="text-lg font-bold font-mono">₹{totalOperationalCost.toLocaleString("en-IN")}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Vehicle ROI</span>
            <p className="text-lg font-bold text-primary font-mono">
              {avgRoi.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Combined Vehicle Performance Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-zinc-300 pb-1">
            <Award className="size-4 text-zinc-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">Vehicle Cost & Performance Ledger</h3>
          </div>
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-zinc-400 text-[10px] font-bold text-zinc-600 font-mono uppercase bg-zinc-100/60">
                <th className="px-2 py-2">Reg No</th>
                <th className="px-2 py-2">Model Name</th>
                <th className="px-2 py-2 text-right">Distance (km)</th>
                <th className="px-2 py-2 text-right">Fuel (L)</th>
                <th className="px-2 py-2 text-right">Efficiency</th>
                <th className="px-2 py-2 text-right">Op. Cost (INR)</th>
                <th className="px-2 py-2 text-right">Revenue (INR)</th>
                <th className="px-2 py-2 text-right">ROI (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-zinc-500">No vehicle data available.</td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.vehicleId} className="hover:bg-zinc-50/50">
                    <td className="px-2 py-2 font-mono font-semibold">{v.regNo}</td>
                    <td className="px-2 py-2">{v.name}</td>
                    <td className="px-2 py-2 text-right font-mono">{v.distanceKm.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right font-mono">{v.fuelLiters.toLocaleString()} L</td>
                    <td className="px-2 py-2 text-right font-mono">{v.fuelEfficiencyKmPerL?.toFixed(2) ?? "N/A"}</td>
                    <td className="px-2 py-2 text-right font-mono">₹{v.operationalCost.toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2 text-right font-mono">₹{v.revenue.toLocaleString("en-IN")}</td>
                    <td className={`px-2 py-2 text-right font-mono font-semibold ${v.roiPercent !== null && v.roiPercent >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {v.roiPercent?.toFixed(1) ?? "N/A"}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Monthly Revenue Section */}
        <div className="grid grid-cols-2 gap-6 print:break-inside-avoid">
          {/* Monthly Revenue List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-zinc-300 pb-1">
              <TrendingUp className="size-4 text-zinc-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">Monthly Revenue Summary</h3>
            </div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-zinc-400 text-[10px] font-bold text-zinc-600 font-mono uppercase bg-zinc-100/60">
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2 text-right">Revenue (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {monthlyRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-center text-zinc-500">No monthly revenue recorded.</td>
                  </tr>
                ) : (
                  monthlyRevenue.map((mr) => (
                    <tr key={mr.month}>
                      <td className="px-3 py-2 font-medium">{mr.month}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">₹{mr.revenue.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Guidelines / Report Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-zinc-300 pb-1">
              <BarChart3 className="size-4 text-zinc-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">Report Notes & Calculation Logic</h3>
            </div>
            <div className="border border-zinc-200 p-4 text-[10px] text-zinc-600 space-y-2 leading-relaxed bg-zinc-50/50">
              <p>
                <strong>1. Vehicle ROI Formula:</strong> ROI is calculated as: 
                <br />
                <code className="bg-zinc-100 px-1 font-mono">ROI = (Revenue - Operational Cost) / Acquisition Cost × 100</code>.
              </p>
              <p>
                <strong>2. Operational Costs:</strong> Represents the sum of all recorded fuel log costs and linked maintenance log costs for the specified vehicle.
              </p>
              <p>
                <strong>3. Fleet Utilization:</strong> Percentage of active vehicles currently deployed on active dispatch trips out of total registered fleet size.
              </p>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="border-t border-zinc-300 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>TransitOps Performance Analytics Ledger</span>
          <span>Confidential — Operational Performance Document</span>
        </div>
      </div>
    </div>
  );
}
