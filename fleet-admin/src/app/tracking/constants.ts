export const STATUS_MAP: Record<string, "active" | "idle" | "offline" | "maintenance"> = {
  available: "idle",
  delivering: "active",
  transporting: "active",
  on_trip: "active",
  maintenance: "maintenance",
  active: "active",
  idle: "idle",
  offline: "offline",
  off_duty: "offline",
  completed: "idle",
};
