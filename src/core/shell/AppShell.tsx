import Sidebar from "./Sidebar";
import Titlebar from "./Titlebar";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg-primary p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
