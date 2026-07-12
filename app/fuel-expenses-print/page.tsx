"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Printer, ArrowLeft, Fuel, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: string;
  vehicle: { regNo: string; name: string };
  trip?: { code: string };
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  date: string;
  note?: string;
  vehicle: { regNo: string; name: string };
  trip?: { code: string };
}

function PrintPageContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || "ALL";

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleInfo, setVehicleInfo] = useState<string>("All Vehicles");

  const [totalFuelCost, setTotalFuelCost] = useState(0);
  const [totalMaintenanceCost, setTotalMaintenanceCost] = useState(0);
  const [totalOperationalCost, setTotalOperationalCost] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fuelRes, expRes] = await Promise.all([
          fetch(`/api/fuel-logs?vehicleId=${vehicleId}`),
          fetch(`/api/expenses?vehicleId=${vehicleId}`),
        ]);

        const fuelJson = await fuelRes.json();
        const expJson = await expRes.json();

        if (fuelJson.data && expJson.data) {
          setFuelLogs(fuelJson.data);
          setExpenses(expJson.data);

          setTotalFuelCost(fuelJson.meta?.totalFuelCost || 0);
          setTotalMaintenanceCost(fuelJson.meta?.totalMaintenanceCost || 0);
          setTotalOperationalCost(fuelJson.meta?.totalOperationalCost || 0);

          // Get vehicle name if filtered
          if (vehicleId !== "ALL" && fuelJson.data?.[0]?.vehicle) {
            const v = fuelJson.data[0].vehicle;
            setVehicleInfo(`${v.regNo} (${v.name})`);
          } else {
            setVehicleInfo("All Vehicles");
          }
        }
      } catch (err) {
        console.error("Failed to load print report data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [vehicleId]);

  // Auto trigger browser print dialog after data is loaded and rendered
  useEffect(() => {
    if (!loading && (fuelLogs.length > 0 || expenses.length > 0)) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, fuelLogs, expenses]);

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
            <h2 className="text-lg font-extrabold text-primary">COST & FUEL REPORT</h2>
            <p className="text-xs text-zinc-600 font-semibold bg-zinc-100 px-2 py-1 inline-block mt-1 uppercase font-mono">
              Vehicle: {vehicleInfo}
            </p>
          </div>
        </div>

        {/* Operational Cost Summary Cards */}
        <div className="grid grid-cols-3 gap-4 border border-zinc-200 bg-zinc-50/50 p-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Total Fuel Cost</span>
            <p className="text-lg font-bold font-mono">₹{totalFuelCost.toLocaleString("en-IN")}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Total Maintenance Cost</span>
            <p className="text-lg font-bold font-mono">₹{totalMaintenanceCost.toLocaleString("en-IN")}</p>
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Total Operational Cost</span>
            <p className="text-lg font-bold text-primary font-mono">₹{totalOperationalCost.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Table 1: Fuel Logs */}
        <div className="space-y-2 print:break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-zinc-300 pb-1">
            <Fuel className="size-4 text-zinc-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">Fuel Refills Log</h3>
          </div>
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-zinc-400 text-[10px] font-bold text-zinc-600 font-mono uppercase bg-zinc-100/60">
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Trip Code</th>
                <th className="px-3 py-2 text-right">Liters</th>
                <th className="px-3 py-2 text-right">Cost (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-zinc-500">No fuel records logged.</td>
                </tr>
              ) : (
                fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50">
                    <td className="px-3 py-2 font-medium">{log.vehicle.regNo} ({log.vehicle.name})</td>
                    <td className="px-3 py-2 font-mono text-zinc-600">{format(new Date(log.date), "dd MMM yyyy")}</td>
                    <td className="px-3 py-2 font-mono text-zinc-600">{log.trip?.code || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{log.liters.toFixed(1)} L</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">₹{Number(log.cost).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2: Other Expenses */}
        <div className="space-y-2 print:break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-zinc-300 pb-1">
            <Landmark className="size-4 text-zinc-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-mono">Other Expenses</h3>
          </div>
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-zinc-400 text-[10px] font-bold text-zinc-600 font-mono uppercase bg-zinc-100/60">
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Trip</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Amount (INR)</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-zinc-500">No expenses recorded.</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-50/50">
                    <td className="px-3 py-2 font-medium">{exp.vehicle.regNo}</td>
                    <td className="px-3 py-2 font-mono text-zinc-600">{exp.trip?.code || "—"}</td>
                    <td className="px-3 py-2 font-mono text-zinc-600">{format(new Date(exp.date), "dd MMM yyyy")}</td>
                    <td className="px-3 py-2"><span className="font-semibold text-zinc-700">{exp.type}</span></td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">₹{Number(exp.amount).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-zinc-600 max-w-xs truncate" title={exp.note}>{exp.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Report Footer */}
        <div className="border-t border-zinc-300 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>TransitOps Fleet Costing Ledger System</span>
          <span>Confidential — For Internal Use Only</span>
        </div>
      </div>
    </div>
  );
}

export default function FuelExpensesPrintPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center text-sm font-mono text-muted-foreground bg-background">
        Loading params...
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}
