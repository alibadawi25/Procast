import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Overview } from './components/Overview';
import { UploadData } from './components/UploadData';
import { Forecast } from './components/Forecast';
import { Dashboard } from './components/Dashboard';
import { ProAsk } from './components/ProAsk';
import { History } from './components/History';
import { CollaboratorNotes } from './components/CollaboratorNotes';
import Intro from './components/Intro';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { Bell, Settings, Sun, Moon, Type, Rows3, DollarSign, Package } from 'lucide-react';

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
  isPinned?: boolean;
}

export interface UploadSession {
  uploadId: string;
  expiresAt: Date;
  hasPromotion: boolean;
  hasPrice: boolean;
  hasDistribution: boolean;
  rowCount: number;
  dateRange: [string, string] | [];
  corrections: string[];
  warnings: string[];
}

const defaultSalesGroups: SalesGroup[] = [
  {
    id: '1',
    name: 'APM 1L',
    timeSpan: 'Jan 2023 - Dec 2024',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: ['Milk'],
    isPinned: false,
  },
  {
    id: '2',
    name: 'APM 1.5L',
    timeSpan: 'Mar 2023 - Dec 2024',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: ['Milk'],
    isPinned: false,
  },
  {
    id: '3',
    name: 'BPM 1L',
    timeSpan: 'Jun 2023 - Nov 2024',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: ['Milk'],
    isPinned: false,
  },
  {
    id: '4',
    name: 'AMJ MS 1L',
    timeSpan: 'Jan 2023 - Dec 2024',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: ['Juice'],
    isPinned: false,
  },
  {
    id: '5',
    name: 'BJ MS 1L',
    timeSpan: 'Feb 2023 - Dec 2024',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: ['Juice'],
    isPinned: false,
  },
  {
    id: '6',
    name: 'Al Marai Butter 500gm',
    timeSpan: 'Jan 2023 - Dec 2024',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: ['Butter', 'importation'],
    isPinned: false,
  },
];

const SECTION_TO_PATH: Record<string, string> = {
  overview: '/overview',
  upload: '/sales-groups',
  forecast: '/forecast',
  dashboard: '/dashboard',
  notes: '/notes',
  proask: '/proask',
  history: '/history',
};

const PATH_TO_SECTION: Record<string, string> = {
  '/': 'overview',
  '/overview': 'overview',
  '/sales-groups': 'upload',
  '/forecast': 'forecast',
  '/dashboard': 'dashboard',
  '/notes': 'notes',
  '/proask': 'proask',
  '/history': 'history',
};

const AUTH_STORAGE_KEY = 'procast:isAuthenticated';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    'APM 1L forecast is ready.',
    "Forecasting engine's regular retraining is due 2 days.",
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [densityMode, setDensityMode] = useState<'comfortable' | 'compact'>('comfortable');
  const [currency, setCurrency] = useState<'EGP' | 'USD' | 'EUR'>('EGP');
  const [units, setUnits] = useState<'units' | 'cartons'>('units');
  const [showSettings, setShowSettings] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [salesGroups, setSalesGroups] = useState<SalesGroup[]>(defaultSalesGroups);
  const [isSalesGroupsLoading, setIsSalesGroupsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uploadSessionsByGroup, setUploadSessionsByGroup] = useState<Record<string, UploadSession>>({});

  const markSalesGroupsStatus = (
    groupIds: string[],
    status: SalesGroup['status'],
    updates?: Partial<Pick<SalesGroup, 'lastUpload' | 'timeSpan'>>
  ) => {
    if (groupIds.length === 0) return;
    setSalesGroups((prev) =>
      prev.map((group) =>
        groupIds.includes(group.id)
          ? { ...group, status, ...(updates ?? {}) }
          : group
      )
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsSalesGroupsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const scale = fontSize === 'sm' ? 0.9 : fontSize === 'lg' ? 1.1 : 1;
    document.documentElement.style.setProperty('--app-font-scale', String(scale));
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, String(isAuthenticated));
    } catch {
      // ignore storage errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const mappedSection = PATH_TO_SECTION[location.pathname];
    if (!mappedSection) {
      navigate('/overview', { replace: true });
      return;
    }
    setActiveSection(mappedSection);
  }, [location.pathname, navigate]);
  
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const nextPath = SECTION_TO_PATH[section] ?? '/overview';
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const handleReorderSalesGroups = (newOrder: SalesGroup[]) => {
    setSalesGroups(newOrder);
  };

  const handleTogglePinSalesGroup = (groupId: string) => {
    setSalesGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? { ...group, isPinned: !group.isPinned }
          : group
      )
    );
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Intro
        onLogin={() => {
          setIsAuthenticated(true);
          navigate('/overview', { replace: true });
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview onNavigate={handleSectionChange} currency={currency} units={units} />;
      case 'upload':
        return (
          <UploadData
            salesGroups={salesGroups}
            onReorder={handleReorderSalesGroups}
            onTogglePin={handleTogglePinSalesGroup}
            isLoading={isSalesGroupsLoading}
            onUploadSuccess={(groupId, session) => {
              setUploadSessionsByGroup((prev) => ({ ...prev, [groupId]: session }));
              markSalesGroupsStatus([groupId], 'ready', {
                lastUpload: 'Just now',
                timeSpan:
                  session.dateRange.length === 2
                    ? `${session.dateRange[0]} - ${session.dateRange[1]}`
                    : 'Not set',
              });
            }}
          />
        );
      case 'forecast':
        return (
          <Forecast
            salesGroups={salesGroups}
            onTogglePin={handleTogglePinSalesGroup}
            isLoading={isSalesGroupsLoading}
            onNavigate={handleSectionChange}
            uploadSessionsByGroup={uploadSessionsByGroup}
            onClearUploadSession={(groupId) =>
              {
                setUploadSessionsByGroup((prev) => {
                  if (!prev[groupId]) return prev;
                  const next = { ...prev };
                  delete next[groupId];
                  return next;
                });
                markSalesGroupsStatus([groupId], 'needs-data', {
                  lastUpload: 'Not uploaded yet',
                  timeSpan: 'Not set',
                });
              }
            }
            onForecastSuccess={(groupIds) => markSalesGroupsStatus(groupIds, 'forecasted')}
            currency={currency}
            units={units}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            salesGroups={salesGroups}
            onTogglePin={handleTogglePinSalesGroup}
            isLoading={isSalesGroupsLoading}
            onNavigate={handleSectionChange}
            currency={currency}
            units={units}
          />
        );
      case 'notes':
        return (
          <CollaboratorNotes
            salesGroups={salesGroups}
            isLoading={isSalesGroupsLoading}
          />
        );
      case 'proask':
        return <ProAsk />;
      case 'history':
        return (
          <History
            salesGroups={salesGroups}
            onTogglePin={handleTogglePinSalesGroup}
            isLoading={isSalesGroupsLoading}
            onNavigate={handleSectionChange}
            currency={currency}
            units={units}
          />
        );
      default:
        return <Overview onNavigate={handleSectionChange} currency={currency} units={units} />;
    }
  };

  return (
    <div className={`flex h-screen bg-background text-foreground ${densityMode === 'compact' ? 'app-density-compact' : 'app-density-comfortable'}`}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed}
      />
      
      <main className={`flex-1 overflow-y-auto relative transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-8 flex flex-col">
          {/* Top bar with notifications and settings */}
          <div className="flex justify-end mb-4 gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                className={`p-2 rounded-full transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-[#1a3a52] text-white hover:bg-[#1a3a52]/90'
                }`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
              </button>
              {showNotifications && (
                
                <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 transform transition duration-200 ease-out scale-95 opacity-0 animate-scaleIn">
                  <ul>
                    {notifications.length === 0 ? (
                      <li className="p-4 text-sm text-sidebar-foreground-255">No notifications</li>
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
                className={`p-2 rounded-full transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-[#1a3a52] text-white hover:bg-[#1a3a52]/90'
                }`}
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={20} />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl z-50 p-4 space-y-4 transform transition duration-200 ease-out scale-95 opacity-0 animate-scaleIn">
                  <div className="pb-2 border-b border-border">
                    <h4 className="text-sm font-semibold">Display Settings</h4>
                    <p className="text-xs text-muted-foreground mt-1">Customize appearance and readability</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sun size={14} />
                      <span>Theme</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm flex items-center justify-center gap-2 ${
                          theme === 'light'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setTheme('light')}
                      >
                        <Sun size={14} />
                        Light
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm flex items-center justify-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setTheme('dark')}
                      >
                        <Moon size={14} />
                        Dark
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Type size={14} />
                      <span>Font Size</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          fontSize === 'sm'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setFontSize('sm')}
                      >
                        Small
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          fontSize === 'md'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setFontSize('md')}
                      >
                        Medium
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          fontSize === 'lg'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setFontSize('lg')}
                      >
                        Large
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Rows3 size={14} />
                      <span>Density</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          densityMode === 'comfortable'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setDensityMode('comfortable')}
                      >
                        Comfortable
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          densityMode === 'compact'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setDensityMode('compact')}
                      >
                        Compact
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Formatting Preferences</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign size={14} />
                      <span>Currency</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          currency === 'EGP'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setCurrency('EGP')}
                      >
                        EGP
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          currency === 'USD'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setCurrency('USD')}
                      >
                        USD
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          currency === 'EUR'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setCurrency('EUR')}
                      >
                        EUR
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package size={14} />
                      <span>Volume</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          units === 'units'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setUnits('units')}
                      >
                        Units
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          units === 'cartons'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border hover:bg-accent/20'
                        }`}
                        onClick={() => setUnits('cartons')}
                      >
                        Cartons
                      </button>
                    </div>
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
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to access your forecasts and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
