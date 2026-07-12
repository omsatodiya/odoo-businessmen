"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Printer, ArrowLeft, Wrench, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Vehicle {
  regNo: string;
  name: string;
}

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  type: string;
  cost: number;
  notes?: string | null;
  status: "ACTIVE" | "COMPLETED";
  openedAt: string;
  closedAt?: string | null;
}

export default function MaintenancePrintPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/maintenance");
        const json = await res.json();
        if (json.data) {
          setLogs(json.data);
        }
      } catch (err) {
        console.error("Failed to load maintenance logs print data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics
  const activeCount = useMemo(() => logs.filter((log) => log.status === "ACTIVE").length, [logs]);
  const completedCount = useMemo(() => logs.filter((log) => log.status === "COMPLETED").length, [logs]);
  const totalCost = useMemo(() => logs.reduce((sum, log) => sum + Number(log.cost), 0), [logs]);

  // Auto trigger browser print dialog after data is loaded and rendered
  useEffect(() => {
    if (!loading && logs.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, logs]);

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
            <h2 className="text-lg font-extrabold text-primary">VEHICLE SERVICE LEDGER</h2>
            <p className="text-xs text-zinc-600 font-semibold bg-zinc-100 px-2 py-1 inline-block mt-1 uppercase font-mono">
              Maintenance Report
            </p>
          </div>
        </div>

        {/* Maintenance Summary Metrics Cards */}
        <div className="grid grid-cols-4 gap-4 border border-zinc-200 bg-zinc-50/50 p-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Total Logs</span>
            <p className="text-lg font-bold font-mono">{logs.length}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Active In Shop</span>
            <p className="text-lg font-bold font-mono text-amber-700">{activeCount}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Completed</span>
            <p className="text-lg font-bold font-mono text-green-700">{completedCount}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Total Cost</span>
            <p className="text-lg font-bold text-primary font-mono">₹{totalCost.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Maintenance Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-zinc-300 pb-1">
            <Wrench className="size-4 text-zinc-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">Detailed Service Logs</h3>
          </div>
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-zinc-400 text-[9px] font-bold text-zinc-600 font-mono uppercase bg-zinc-100/60">
                <th className="px-2 py-2">Vehicle</th>
                <th className="px-2 py-2">Service Type</th>
                <th className="px-2 py-2 text-right">Cost (INR)</th>
                <th className="px-2 py-2 text-center">Status</th>
                <th className="px-2 py-2">Opened At</th>
                <th className="px-2 py-2">Completed At</th>
                <th className="px-2 py-2">Notes/Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-zinc-500">No service logs available.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50">
                    <td className="px-2 py-2 font-mono font-semibold">{log.vehicle.regNo} <span className="text-[9px] font-normal text-zinc-500">({log.vehicle.name})</span></td>
                    <td className="px-2 py-2 font-medium">{log.type}</td>
                    <td className="px-2 py-2 text-right font-mono font-semibold">₹{Number(log.cost).toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold tracking-wider rounded-sm font-mono uppercase ${
                        log.status === "ACTIVE" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-zinc-500">{format(new Date(log.openedAt), "dd MMM yyyy")}</td>
                    <td className="px-2 py-2 font-mono text-zinc-500">
                      {log.closedAt ? format(new Date(log.closedAt), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-2 py-2 text-zinc-600 max-w-[180px] truncate" title={log.notes || ""}>
                      {log.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Footer */}
        <div className="border-t border-zinc-300 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>TransitOps Fleet Maintenance Ledger</span>
          <span>Confidential — Operational Service Document</span>
        </div>
      </div>
    </div>
  );
}
