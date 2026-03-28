import { useEffect } from "react";
import { showToast } from "../ui/Toast";

/**
 * Checks for app updates on startup.
 * If an update is found, prompts the user to install it.
 * Only runs inside Tauri (skipped in browser dev mode).
 */
export function useUpdater() {
  useEffect(() => {
    // Skip in browser dev mode
    if (!("__TAURI_INTERNALS__" in window)) {
      console.log("[Updater] Not in Tauri, skipping update check");
      return;
    }

    const checkForUpdate = async () => {
      console.log("[Updater] Starting update check...");
      showToast("Checking for updates...", "info", 2000);

      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        console.log("[Updater] Plugin loaded, calling check()...");
        const update = await check();
        console.log("[Updater] Check result:", update);

        if (update) {
          console.log(`[Updater] Found update: v${update.version}`);
          showToast(
            `Update v${update.version} available! Downloading...`,
            "info",
            5000
          );

          await update.downloadAndInstall((event) => {
            if (event.event === "Started" && event.data.contentLength) {
              console.log(
                `[Updater] Downloading ${(event.data.contentLength / 1024 / 1024).toFixed(1)}MB`
              );
            }
          });

          showToast("Update installed! Restarting...", "success", 3000);

          const { relaunch } = await import("@tauri-apps/plugin-process");
          setTimeout(() => relaunch(), 2000);
        } else {
          console.log("[Updater] App is up to date");
          showToast("App is up to date", "success", 2000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Updater] Check failed:", message);
        showToast(`Update check failed: ${message}`, "error", 6000);
      }
    };

    // Delay the check so the app loads first
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);
}
