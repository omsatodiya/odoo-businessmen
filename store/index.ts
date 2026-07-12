// Barrel file for Zustand stores. Each teammate adds their slice's store
// export here as it's built (see plan.md §5 for the slice shape convention).
export { useUiStore } from "@/store/ui-slice";
export { useVehicleStore } from "@/store/vehicle-slice";
export { useMaintenanceStore } from "@/store/maintenance-slice";

export { useDriverStore } from "@/store/driver-slice";

