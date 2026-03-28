import { ThemeProvider } from "./core/theme/ThemeProvider";
import PluginLoader from "./core/plugins/PluginLoader";

function App() {
  return (
    <ThemeProvider>
      <PluginLoader />
    </ThemeProvider>
  );
}

export default App;
