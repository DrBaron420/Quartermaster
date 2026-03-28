import Sidebar from "./Sidebar";
import Titlebar from "./Titlebar";
import { useSync } from "@/shared/hooks/useSync";
import { useUpdater } from "@/shared/hooks/useUpdater";
import { ToastContainer } from "@/shared/ui/Toast";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShell({ children }: AppShellProps) {
  // Initialize sync engine and check for updates on startup
  useSync();
  useUpdater();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg-primary p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default AppShell;
