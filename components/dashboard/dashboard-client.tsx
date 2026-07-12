"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { VehicleType, VehicleStatus } from "@prisma/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DashboardKPIs {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenanceVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

interface RecentTrip {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: string;
  plannedDistanceKm: number;
  dispatchedAt: string | null;
  vehicle: {
    regNo: string;
    name: string;
    status: string;
  };
  driver: {
    name: string;
  };
}

interface StatusDistribution {
  available: number;
  onTrip: number;
  inShop: number;
  retired: number;
  total: number;
}

interface DashboardData {
  regions: string[];
  kpis: DashboardKPIs;
  recentTrips: RecentTrip[];
  vehicleStatusDistribution: StatusDistribution;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const [vehicleType, setVehicleType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [region, setRegion] = useState<string>("ALL");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (vehicleType !== "ALL") params.append("type", vehicleType);
      if (status !== "ALL") params.append("status", status);
      if (region !== "ALL") params.append("region", region);

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      const json = await res.json();
      setData(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [vehicleType, status, region]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Trip status styles & labels mapped cleanly
  const getTripStatusDetails = (trip: RecentTrip) => {
    if (trip.status === "DRAFT") {
      return {
        label: "Draft",
        classStr: "bg-[#737373]/20 text-[#737373] dark:bg-[#a6a6a6]/20 dark:text-[#a6a6a6] border border-[#737373]/30",
      };
    }
    if (trip.status === "COMPLETED") {
      return {
        label: "Completed",
        classStr: "bg-[#10b77f] text-white dark:bg-[#47d1a3] dark:text-[#001833] font-bold border border-[#10b77f]",
      };
    }
    if (trip.status === "CANCELLED") {
      return {
        label: "Cancelled",
        classStr: "bg-[#ce1212]/20 text-[#ce1212] border border-[#ce1212]/30",
      };
    }
    if (trip.status === "DISPATCHED") {
      // If the vehicle itself is ON_TRIP, trip is rendered as "On Trip" (blue fill badge)
      if (trip.vehicle?.status === "ON_TRIP") {
        return {
          label: "On Trip",
          classStr: "bg-[#1166d4] text-white dark:bg-[#80bbff] dark:text-[#001833] font-bold border border-[#1166d4]",
        };
      }
      return {
        label: "Dispatched",
        classStr: "bg-[#1166d4] text-white dark:bg-[#80bbff] dark:text-[#001833] font-bold border border-[#1166d4]",
      };
    }
    return {
      label: trip.status,
      classStr: "bg-muted text-muted-foreground border border-border",
    };
  };

  // Smart ETA calculations for Dispatched trips
  const getTripEta = (trip: RecentTrip) => {
    if (trip.status === "DRAFT") {
      return "Awaiting vehicle";
    }
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
      return "—";
    }
    if (trip.status === "DISPATCHED" && trip.dispatchedAt) {
      const dispatchedTime = new Date(trip.dispatchedAt).getTime();
      const speedKmh = 50; // Average transit speed
      const durationMin = (trip.plannedDistanceKm / speedKmh) * 60;
      const elapsedMin = (Date.now() - dispatchedTime) / 60000;
      const remainingMin = Math.max(5, Math.round(durationMin - elapsedMin));

      if (remainingMin > 60) {
        const hours = Math.floor(remainingMin / 60);
        const mins = remainingMin % 60;
        return `${hours}h ${mins}m`;
      }
      return `${remainingMin} min`;
    }
    return "—";
  };

  // Vehicle stats bars calculations
  const distribution = data?.vehicleStatusDistribution || {
    available: 0,
    onTrip: 0,
    inShop: 0,
    retired: 0,
    total: 0,
  };
  const totalVehicles = distribution.total || 1;

  const statusBars = [
    {
      label: "Available",
      percentage: (distribution.available / totalVehicles) * 100,
      color: "bg-[#10b77f]", // green
    },
    {
      label: "On Trip",
      percentage: (distribution.onTrip / totalVehicles) * 100,
      color: "bg-[#1166d4]", // blue
    },
    {
      label: "In Shop",
      percentage: (distribution.inShop / totalVehicles) * 100,
      color: "bg-[#e07306]", // orange
    },
    {
      label: "Retired",
      percentage: (distribution.retired / totalVehicles) * 100,
      color: "bg-[#ce1212]", // red
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Filters Header Block */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
          FILTERS
        </span>
        <div className="flex flex-wrap gap-3">
          {/* Vehicle Type Filter */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Vehicle Type</span>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger className="h-8 min-w-[140px] rounded-none border-border bg-card text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="ALL">All</SelectItem>
                {Object.values(VehicleType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Status Filter */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 min-w-[140px] rounded-none border-border bg-card text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="ALL">All</SelectItem>
                {Object.values(VehicleStatus).map((stat) => (
                  <SelectItem key={stat} value={stat}>
                    {stat === "ON_TRIP"
                      ? "On Trip"
                      : stat === "IN_SHOP"
                      ? "In Shop"
                      : stat.charAt(0) + stat.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region Filter */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Region</span>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-8 min-w-[140px] rounded-none border-border bg-card text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="ALL">All</SelectItem>
                {data?.regions.map((reg) => (
                  <SelectItem key={reg} value={reg}>
                    {reg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-end pb-0.5">
              <Button
                variant="outline"
                size="xs"
                onClick={fetchData}
                className="h-8 rounded-none border-destructive text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="mr-1 size-3" /> Retry
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="flex items-center gap-2 border border-destructive bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* 2. KPI Cards Row */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border border-border bg-card p-3 rounded-none h-20 border-l-4 border-l-muted-foreground/30 flex flex-col justify-between"
            >
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="h-6 w-1/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        data && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
          >
            {/* KPI 1: Active Vehicles */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#1166d4] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                ACTIVE VEHICLES
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {String(data.kpis.activeVehicles).padStart(2, "0")}
              </span>
            </motion.div>

            {/* KPI 2: Available Vehicles */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#10b77f] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                AVAILABLE VEHICLES
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {String(data.kpis.availableVehicles).padStart(2, "0")}
              </span>
            </motion.div>

            {/* KPI 3: Vehicles in Maintenance */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#e07306] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                VEHICLES IN MAINTENANCE
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {String(data.kpis.inMaintenanceVehicles).padStart(2, "0")}
              </span>
            </motion.div>

            {/* KPI 4: Active Trips */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#1166d4] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                ACTIVE TRIPS
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {String(data.kpis.activeTrips).padStart(2, "0")}
              </span>
            </motion.div>

            {/* KPI 5: Pending Trips */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#1166d4] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                PENDING TRIPS
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {String(data.kpis.pendingTrips).padStart(2, "0")}
              </span>
            </motion.div>

            {/* KPI 6: Drivers on Duty */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#1166d4] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                DRIVERS ON DUTY
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {String(data.kpis.driversOnDuty).padStart(2, "0")}
              </span>
            </motion.div>

            {/* KPI 7: Fleet Utilization */}
            <motion.div
              variants={itemVariants}
              className="border border-border bg-card p-3 rounded-none border-l-4 border-l-[#10b77f] flex flex-col justify-between h-20"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                FLEET UTILIZATION
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {data.kpis.fleetUtilization}%
              </span>
            </motion.div>
          </motion.div>
        )
      )}

      {/* 3. Bottom Panels Grid (Recent Trips Table & Vehicle Status) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Trips Table */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
            RECENT TRIPS
          </span>
          <div className="border border-border bg-card rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">TRIP</th>
                    <th className="px-4 py-3 font-semibold">VEHICLE</th>
                    <th className="px-4 py-3 font-semibold">DRIVER</th>
                    <th className="px-4 py-3 font-semibold">STATUS</th>
                    <th className="px-4 py-3 font-semibold">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-3 w-12 bg-muted rounded" /></td>
                        <td className="px-4 py-3"><div className="h-3 w-16 bg-muted rounded" /></td>
                        <td className="px-4 py-3"><div className="h-3 w-14 bg-muted rounded" /></td>
                        <td className="px-4 py-3"><div className="h-5 w-16 bg-muted rounded" /></td>
                        <td className="px-4 py-3"><div className="h-3 w-20 bg-muted rounded" /></td>
                      </tr>
                    ))
                  ) : !data || data.recentTrips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No recent trips matching the filtered criteria.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {data.recentTrips.map((trip) => {
                        const statusDetails = getTripStatusDetails(trip);
                        const eta = getTripEta(trip);
                        return (
                          <motion.tr
                            key={trip.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-muted/10 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-medium text-foreground">
                              {trip.code}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {trip.vehicle?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {trip.driver?.name || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-3 py-1 text-[10px] font-bold tracking-wide rounded-none uppercase transition-all select-none ${statusDetails.classStr}`}
                              >
                                {statusDetails.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono">
                              {eta}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Vehicle Status Progress Bars */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
            VEHICLE STATUS
          </span>
          <div className="border border-border bg-card p-4 rounded-none h-fit space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1 animate-pulse">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              ))
            ) : (
              statusBars.map((bar) => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{bar.label}</span>
                  </div>
                  <div className="w-full bg-muted h-3.5 rounded-none relative overflow-hidden border border-border/50">
                    <motion.div
                      className={`h-full ${bar.color} rounded-none`}
                      initial={{ width: 0 }}
                      animate={{ width: `${bar.percentage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
