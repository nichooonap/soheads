// Anonymous per-browser device id for voting / squad authorship.
const KEY = "soheads_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}
