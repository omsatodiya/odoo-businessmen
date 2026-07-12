"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Fuel, Landmark, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FilterBar } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFuelExpenseStore } from "@/store/fuel-expense-slice";
import { LogFuelModal } from "@/components/fuel/log-fuel-modal";
import { AddExpenseModal } from "@/components/fuel/add-expense-modal";
import { cn } from "@/lib/utils";

interface OptionVehicle {
  id: string;
  regNo: string;
  name: string;
}

export default function FuelExpensesPage() {
  const {
    fuelLogs,
    expenses,
    loading,
    totalFuelCost,
    totalMaintenanceCost,
    totalOperationalCost,
    filters,
    fetchFuelLogs,
    fetchExpenses,
    setFilter,
  } = useFuelExpenseStore();

  const [vehicles, setVehicles] = useState<OptionVehicle[]>([]);
  const [logFuelOpen, setLogFuelOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  useEffect(() => {
    // Load vehicles for the page-level filter dropdown
    fetch("/api/fuel-logs/options")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.vehicles) {
          setVehicles(json.data.vehicles);
        }
      })
      .catch((err) => console.error("Failed to load filter vehicles", err));

    fetchFuelLogs();
    fetchExpenses();
  }, [fetchFuelLogs, fetchExpenses]);

  const fuelLogsColumns = [
    {
      header: "Vehicle",
      accessorKey: "vehicle",
      cell: (log: any) => (
        <div className="font-semibold text-foreground">
          {log.vehicle?.regNo} <span className="text-xs font-normal text-muted-foreground">({log.vehicle?.name})</span>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (log: any) => (
        <span className="font-mono text-muted-foreground">
          {format(new Date(log.date), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      header: "Liters",
      accessorKey: "liters",
      className: "font-mono tabular-nums text-right",
      cell: (log: any) => <span>{log.liters.toFixed(1)} L</span>,
    },
    {
      header: "Fuel Cost",
      accessorKey: "cost",
      className: "font-mono tabular-nums text-right font-semibold",
      cell: (log: any) => <span>{Number(log.cost).toLocaleString("en-IN")}</span>,
    },
  ];

  const expensesColumns = [
    {
      header: "Trip",
      accessorKey: "trip",
      cell: (exp: any) => (
        <span className="font-mono font-semibold text-foreground">
          {exp.trip?.code || "—"}
        </span>
      ),
    },
    {
      header: "Vehicle",
      accessorKey: "vehicle",
      cell: (exp: any) => (
        <span className="font-medium text-foreground">
          {exp.vehicle?.regNo}
        </span>
      ),
    },
    {
      header: "Toll",
      accessorKey: "amount",
      className: "font-mono tabular-nums text-right text-muted-foreground",
      cell: (exp: any) => (
        <span>{exp.type === "TOLL" ? Number(exp.amount).toLocaleString("en-IN") : "0"}</span>
      ),
    },
    {
      header: "Other",
      accessorKey: "amount",
      className: "font-mono tabular-nums text-right text-muted-foreground",
      cell: (exp: any) => (
        <span>
          {["PARKING", "OTHER", "FUEL"].includes(exp.type)
            ? Number(exp.amount).toLocaleString("en-IN")
            : "0"}
        </span>
      ),
    },
    {
      header: "Maint. (Linked)",
      accessorKey: "amount",
      className: "font-mono tabular-nums text-right text-muted-foreground",
      cell: (exp: any) => (
        <span>
          {exp.type === "MAINTENANCE" ? Number(exp.amount).toLocaleString("en-IN") : "0"}
        </span>
      ),
    },
    {
      header: "Total",
      accessorKey: "amount",
      className: "font-mono tabular-nums text-right font-semibold",
      cell: (exp: any) => <span>{Number(exp.amount).toLocaleString("en-IN")}</span>,
    },
    {
      header: "Trip Status",
      accessorKey: "trip",
      cell: (exp: any) => (
        exp.trip?.status ? <StatusBadge status={exp.trip.status} /> : <span className="text-muted-foreground/60">—</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel & Expense Management"
        description="Monitor operational costs, fuel efficiency, and fleet expenses."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setLogFuelOpen(true)}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium h-9 gap-1.5"
            >
              <Plus className="size-4" />
              Log Fuel
            </Button>
            <Button
              onClick={() => setAddExpenseOpen(true)}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium h-9 gap-1.5"
            >
              <Plus className="size-4" />
              Add Expense
            </Button>
          </div>
        }
      />

      {/* KPI Cost Breakdown Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Fuel Cost"
          value={totalFuelCost.toLocaleString("en-IN")}
          unit=" INR"
        />
        <KpiCard
          label="Total Maintenance Cost"
          value={totalMaintenanceCost.toLocaleString("en-IN")}
          unit=" INR"
        />
        <KpiCard
          label="Total Operational Cost"
          value={totalOperationalCost.toLocaleString("en-IN")}
          unit=" INR"
          accentClassName="border-l-2 border-l-primary"
        />
      </div>

      <FilterBar>
        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mr-2">
          Filter by Vehicle:
        </span>
        <Select
          value={filters.vehicleId}
          onValueChange={(val) => setFilter("vehicleId", val)}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Vehicles</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.regNo} ({v.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {/* Stacked Tables layout per the mockup */}
      <div className="space-y-8">
        {/* Table 1: Fuel Logs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Fuel className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
              Fuel Logs
            </h2>
          </div>
          <div className="border border-border bg-card">
            <DataTable
              columns={fuelLogsColumns}
              data={fuelLogs}
              isLoading={loading}
              emptyMessage="No fuel logs logged yet for this selection."
              getRowKey={(row) => row.id}
            />

            {/* Mobile View for Fuel Logs */}
            <div className="block md:hidden divide-y divide-border">
              {fuelLogs.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No fuel logs logged yet.
                </div>
              ) : (
                fuelLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="font-semibold text-foreground">{log.vehicle?.regNo}</div>
                      <div className="font-mono font-bold">{Number(log.cost).toLocaleString("en-IN")} INR</div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <div>Date: {format(new Date(log.date), "dd MMM yyyy")}</div>
                      <div>Liters: {log.liters.toFixed(1)} L</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Table 2: Other Expenses */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Landmark className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground uppercase tracking-wide">
              Other Expenses (Toll / Misc)
            </h2>
          </div>
          <div className="border border-border bg-card">
            <DataTable
              columns={expensesColumns}
              data={expenses}
              isLoading={loading}
              emptyMessage="No expenses added yet for this selection."
              getRowKey={(row) => row.id}
            />

            {/* Mobile View for Other Expenses */}
            <div className="block md:hidden divide-y divide-border">
              {expenses.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No expenses added yet.
                </div>
              ) : (
                expenses.map((exp) => (
                  <div key={exp.id} className="p-4 space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="font-semibold text-foreground">
                        {exp.vehicle?.regNo} {exp.trip ? `(Trip ${exp.trip.code})` : ""}
                      </div>
                      <div className="font-mono font-bold text-foreground">
                        {Number(exp.amount).toLocaleString("en-IN")} INR
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-muted-foreground">
                      <div>Date: {format(new Date(exp.date), "dd MMM yyyy")}</div>
                      <div>Type: {exp.type}</div>
                    </div>
                    {exp.note ? (
                      <div className="text-xs text-muted-foreground bg-muted/40 p-1.5 border-l-2 border-border mt-1">
                        Note: {exp.note}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Operational Cost Highlight Panel */}
        <div className="border border-border bg-card p-4 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
            Total Operational Cost (Auto) = Fuel + Maint
          </span>
          <span className="font-mono text-3xl font-bold tracking-tight text-chart-3">
            {totalOperationalCost.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <LogFuelModal open={logFuelOpen} onOpenChange={setLogFuelOpen} />
      <AddExpenseModal open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
    </div>
  );
}
