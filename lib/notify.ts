// lib/notify.ts
export type ToastType = "success" | "error" | "info";

/**
 * Dispatch a global toast event that ToastContainer listens to.
 * Safe to call from server-side code (no-op there).
 */
export function notify(type: ToastType, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { type, message } }));
}
