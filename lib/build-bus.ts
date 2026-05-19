// Tiny pub/sub bridge so the global Navbar can drive the /build page's
// Save & share action without prop drilling.

type Listener = () => void;

let canSave = false;
const listeners = new Set<Listener>();

export const buildBus = {
  setCanSave(value: boolean) {
    if (canSave === value) return;
    canSave = value;
    listeners.forEach((l) => l());
  },
  getCanSave() {
    return canSave;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  requestSave() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("soheads:request-save"));
    }
  },
};
