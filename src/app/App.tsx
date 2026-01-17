import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Overview } from "./components/Overview";
import { UploadData } from "./components/UploadData";
import { Forecast } from "./components/Forecast";
import { Dashboard } from "./components/Dashboard";
import { ProAsk } from "./components/ProAsk";
import { History } from "./components/History";
import Intro from "./components/Intro";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Bell, Settings } from "lucide-react";

export default function App() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    "APM 1L forecast is ready.",
    "Forecasting engine's regular retraining is due 2 days.",
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [showSettings, setShowSettings] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Intro onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <Overview onNavigate={handleSectionChange} />;
      case "upload":
        return <UploadData />;
      case "forecast":
        return <Forecast />;
      case "dashboard":
        return <Dashboard />;
      case "proask":
        return <ProAsk />;
      case "history":
        return <History />;
      default:
        return <Overview onNavigate={handleSectionChange} />;
    }
  };

  return (
    <div
      className={`flex h-screen ${theme === "light" ? "bg-background text-foreground" : "bg-gray-900 text-white"} ${fontSize === "sm" ? "text-sm" : fontSize === "md" ? "text-base" : "text-lg"}`}
    >
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} overflow-y-auto relative transition-all duration-300`}
      >
        <div className="p-8 flex flex-col">
          {/* Top bar with notifications and settings */}
          <div className="flex justify-end mb-4 gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                className="p-2 rounded-full bg-sidebar-accent text-sidebar-primary hover:bg-sidebar-accent/80 transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 transform transition duration-200 ease-out scale-95 opacity-0 animate-scaleIn">
                  <ul>
                    {notifications.length === 0 ? (
                      <li className="p-4 text-sm text-sidebar-foreground-255">
                        No notifications
                      </li>
                    ) : (
                      notifications.map((notif, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-3 border-b last:border-b-0 hover:bg-sidebar-accent/10 cursor-pointer transition-colors"
                        >
                          {notif}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <div className="relative">
              <button
                className="p-2 rounded-full bg-sidebar-accent text-sidebar-primary hover:bg-sidebar-accent/80 transition-colors"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={20} />
              </button>
              {showSettings && (
                <div
                  className={`absolute right-0 mt-2 w-64 border rounded-lg shadow-lg z-50 p-4 space-y-4 transform transition duration-200 ease-out scale-95 opacity-0 animate-scaleIn ${theme === "light" ? "bg-background text-foreground" : "bg-gray-800 text-white"}`}
                >
                  {/* Theme Switcher */}
                  <div>
                    <p className="text-sm text-sidebar-foreground/70 mb-1">
                      Theme
                    </p>
                    <button
                      className={`px-3 py-1 rounded ${theme === "light" ? "bg-sidebar-accent text-sidebar-primary" : "bg-sidebar-foreground/10"}`}
                      onClick={() => setTheme("light")}
                    >
                      Light
                    </button>
                    <button
                      className={`px-3 py-1 rounded ml-2 ${theme === "dark" ? "bg-sidebar-accent text-sidebar-primary" : "bg-sidebar-foreground/10"}`}
                      onClick={() => setTheme("dark")}
                    >
                      Dark
                    </button>
                  </div>
                  {/* Accessibility Options */}
                  <div>
                    <p className="text-sm text-sidebar-foreground/70 mb-1">
                      Font Size
                    </p>
                    <button
                      className={`px-3 py-1 rounded ${fontSize === "sm" ? "bg-sidebar-accent text-sidebar-primary" : "bg-sidebar-foreground/10"}`}
                      onClick={() => setFontSize("sm")}
                    >
                      Small
                    </button>
                    <button
                      className={`px-3 py-1 rounded ml-2 ${fontSize === "md" ? "bg-sidebar-accent text-sidebar-primary" : "bg-sidebar-foreground/10"}`}
                      onClick={() => setFontSize("md")}
                    >
                      Medium
                    </button>
                    <button
                      className={`px-3 py-1 rounded ml-2 ${fontSize === "lg" ? "bg-sidebar-accent text-sidebar-primary" : "bg-sidebar-foreground/10"}`}
                      onClick={() => setFontSize("lg")}
                    >
                      Large
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {renderContent()}
        </div>
      </main>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to access your forecasts and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
