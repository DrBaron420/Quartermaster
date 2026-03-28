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
    if (!("__TAURI__" in window)) return;

    const checkForUpdate = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();

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

          // Relaunch after a brief delay so the user sees the toast
          const { relaunch } = await import("@tauri-apps/plugin-process");
          setTimeout(() => relaunch(), 2000);
        } else {
          console.log("[Updater] App is up to date");
        }
      } catch (err) {
        console.error("[Updater] Check failed:", err);
        // Don't show error toast — update check failures are silent
      }
    };

    // Delay the check slightly so the app loads first
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);
}
