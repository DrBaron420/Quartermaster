import { ThemeProvider } from "./core/theme/ThemeProvider";
import AppShell from "./core/shell/AppShell";

function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome to Quartermaster</h1>
      <p className="text-text-secondary">
        Your gaming toolkit hub. Enable game modules in Settings to get started.
      </p>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppShell>
        <HomePage />
      </AppShell>
    </ThemeProvider>
  );
}

export default App;
