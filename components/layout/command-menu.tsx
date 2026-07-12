"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Truck,
  Users,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  ArrowRightLeft,
} from "lucide-react";
import { useVehicleStore } from "@/store/vehicle-slice";
import { useDriverStore } from "@/store/driver-slice";
import { useTripStore } from "@/store/trip-slice";

import type { Access, Resource } from "@/lib/rbac";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Record<Resource, Access>;
}

export function CommandMenu({ open, onOpenChange, permissions }: CommandMenuProps) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const fetchVehicles = permissions["FLEET"] !== "NONE"
          ? fetch("/api/vehicles").then((res) => (res.ok ? res.json() : null))
          : Promise.resolve(null);

        const fetchDrivers = permissions["DRIVERS"] !== "NONE"
          ? fetch("/api/drivers").then((res) => (res.ok ? res.json() : null))
          : Promise.resolve(null);

        const fetchTrips = permissions["TRIPS"] !== "NONE"
          ? fetch("/api/trips").then((res) => (res.ok ? res.json() : null))
          : Promise.resolve(null);

        const [vehiclesData, driversData, tripsData] = await Promise.all([
          fetchVehicles,
          fetchDrivers,
          fetchTrips,
        ]);

        if (vehiclesData) {
          setVehicles(vehiclesData.data || []);
        } else {
          setVehicles([]);
        }

        if (driversData) {
          setDrivers(driversData.data || []);
        } else {
          setDrivers([]);
        }

        if (tripsData) {
          setTrips(tripsData.data || []);
        } else {
          setTrips([]);
        }
      } catch (err) {
        console.error("Failed to load search data for command palette", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchAllData();
  }, [open, permissions]);

  const handleSelectPage = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const handleSelectVehicle = (regNo: string) => {
    onOpenChange(false);
    useVehicleStore.getState().setFilter("q", regNo);
    router.push("/fleet");
  };

  const handleSelectDriver = (name: string) => {
    onOpenChange(false);
    useDriverStore.getState().setFilter("q", name);
    router.push("/drivers");
  };

  const handleSelectTrip = (code: string) => {
    onOpenChange(false);
    useTripStore.getState().setFilter("q", code);
    useTripStore.getState().fetch();
    router.push("/trips");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Fleet Registry" description="Quickly search and jump to vehicles, drivers, trips, or pages.">
      <Command className="flex flex-col h-[400px]">
        <CommandInput placeholder="Search vehicles, drivers, trips, or pages..." />
        <CommandList className="flex-1 overflow-y-auto no-scrollbar">
          <CommandEmpty>
            {loading ? "Loading search registry..." : "No results found."}
          </CommandEmpty>

          <CommandGroup heading="Pages & Navigation">
            {permissions["DASHBOARD"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/dashboard")}
                className="cursor-pointer"
              >
                <LayoutDashboard className="mr-2 size-4" />
                <span>Dashboard</span>
              </CommandItem>
            )}
            {permissions["FLEET"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/fleet")}
                className="cursor-pointer"
              >
                <Truck className="mr-2 size-4" />
                <span>Fleet Registry</span>
              </CommandItem>
            )}
            {permissions["DRIVERS"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/drivers")}
                className="cursor-pointer"
              >
                <Users className="mr-2 size-4" />
                <span>Drivers Registry</span>
              </CommandItem>
            )}
            {permissions["TRIPS"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/trips")}
                className="cursor-pointer"
              >
                <ArrowRightLeft className="mr-2 size-4" />
                <span>Trips & Dispatch</span>
              </CommandItem>
            )}
            {permissions["FLEET"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/maintenance")}
                className="cursor-pointer"
              >
                <Wrench className="mr-2 size-4" />
                <span>Vehicle Maintenance</span>
              </CommandItem>
            )}
            {permissions["FUEL_EXPENSES"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/fuel-expenses")}
                className="cursor-pointer"
              >
                <Receipt className="mr-2 size-4" />
                <span>Fuel & Expenses</span>
              </CommandItem>
            )}
            {permissions["ANALYTICS"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/analytics")}
                className="cursor-pointer"
              >
                <BarChart3 className="mr-2 size-4" />
                <span>Reports & Analytics</span>
              </CommandItem>
            )}
            {permissions["SETTINGS"] !== "NONE" && (
              <CommandItem
                onSelect={() => handleSelectPage("/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </CommandItem>
            )}
          </CommandGroup>

          {vehicles.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Vehicles">
                {vehicles.map((v) => (
                  <CommandItem
                    key={v.id}
                    onSelect={() => handleSelectVehicle(v.regNo)}
                    className="cursor-pointer"
                  >
                    <Truck className="mr-2 size-4 text-muted-foreground" />
                    <span className="font-mono font-semibold text-xs tracking-wider uppercase mr-2">{v.regNo}</span>
                    <span className="text-muted-foreground">— {v.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {drivers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Drivers">
                {drivers.map((d) => (
                  <CommandItem
                    key={d.id}
                    onSelect={() => handleSelectDriver(d.name)}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 size-4 text-muted-foreground" />
                    <span>{d.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">( {d.licenseCategory} )</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {trips.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Trips">
                {trips.map((t) => (
                  <CommandItem
                    key={t.id}
                    onSelect={() => handleSelectTrip(t.code)}
                    className="cursor-pointer"
                  >
                    <ArrowRightLeft className="mr-2 size-4 text-muted-foreground" />
                    <span className="font-mono text-xs font-semibold mr-2">{t.code}</span>
                    <span className="text-muted-foreground">( {t.source} → {t.destination} )</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
