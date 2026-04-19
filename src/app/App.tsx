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
  API_BASE_URL,
  authFetch,
  clearStoredAccessToken,
  fetchCurrentUser,
  getStoredAccessToken,
  loginWithPassword,
  storeAccessToken,
  type AuthenticatedUser,
} from './lib/auth';
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
import { Bell, Settings, Sun, Moon, Type, Rows3, DollarSign, Package, Menu } from 'lucide-react';
import { useIsMobile } from './components/ui/use-mobile';

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

interface BackendSalesGroup {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

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

function mapSalesGroup(group: BackendSalesGroup): SalesGroup {
  return {
    id: group.id,
    name: group.name,
    timeSpan: 'Not set',
    lastUpload: 'Not uploaded yet',
    status: 'needs-data',
    tags: group.category ? [group.category] : [],
    isPinned: false,
  };
}

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
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [salesGroups, setSalesGroups] = useState<SalesGroup[]>([]);
  const [isSalesGroupsLoading, setIsSalesGroupsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uploadSessionsByGroup, setUploadSessionsByGroup] = useState<Record<string, UploadSession>>({});
  const isMobile = useIsMobile();

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
    let isCancelled = false;
    const token = getStoredAccessToken();

    if (!token) {
      setAuthStatus('anonymous');
      return;
    }

    const restoreSession = async () => {
      try {
        const user = await fetchCurrentUser(token);
        if (isCancelled) return;
        setAuthUser(user);
        setAuthStatus('authenticated');
      } catch {
        clearStoredAccessToken();
        if (isCancelled) return;
        setAuthUser(null);
        setAuthStatus('anonymous');
      }
    };

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const scale = fontSize === 'sm' ? 0.9 : fontSize === 'lg' ? 1.1 : 1;
    document.documentElement.style.setProperty('--app-font-scale', String(scale));
  }, [fontSize]);

  useEffect(() => {
    const mappedSection = PATH_TO_SECTION[location.pathname];
    if (!mappedSection) {
      navigate('/overview', { replace: true });
      return;
    }
    setActiveSection(mappedSection);
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      setSalesGroups([]);
      setIsSalesGroupsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadSalesGroups = async () => {
      setIsSalesGroupsLoading(true);

      try {
        const response = await authFetch(`${API_BASE_URL}/sales-groups/`);

        if (response.status === 401) {
          throw new Error('Your session expired. Please sign in again.');
        }

        if (!response.ok) {
          throw new Error('Unable to load your sales groups right now.');
        }

        const payload = (await response.json()) as BackendSalesGroup[];
        if (isCancelled) return;
        setSalesGroups(payload.map(mapSalesGroup));
      } catch (error) {
        if (isCancelled) return;

        if (error instanceof Error && error.message.includes('session expired')) {
          clearStoredAccessToken();
          setAuthUser(null);
          setAuthStatus('anonymous');
          navigate('/', { replace: true });
          return;
        }

        setSalesGroups([]);
      } finally {
        if (!isCancelled) {
          setIsSalesGroupsLoading(false);
        }
      }
    };

    void loadSalesGroups();

    return () => {
      isCancelled = true;
    };
  }, [authStatus, navigate]);
  
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
    clearStoredAccessToken();
    setAuthUser(null);
    setUploadSessionsByGroup({});
    setAuthStatus('anonymous');
    navigate('/', { replace: true });
  };

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Restoring your session...</span>
        </div>
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return (
      <Intro
        onLogin={async ({ email, password }) => {
          const { access_token } = await loginWithPassword(email, password);

          try {
            storeAccessToken(access_token);
            const user = await fetchCurrentUser(access_token);
            setAuthUser(user);
            setAuthStatus('authenticated');
            navigate('/overview', { replace: true });
          } catch (error) {
            clearStoredAccessToken();
            setAuthUser(null);
            setAuthStatus('anonymous');
            throw error;
          }
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
    <div className={`flex min-h-[100dvh] bg-background text-foreground ${densityMode === 'compact' ? 'app-density-compact' : 'app-density-comfortable'}`}>
      {isMobile && !isSidebarCollapsed && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed}
        isMobile={isMobile}
        user={authStatus === 'authenticated' ? authUser : null}
      />
      
      <main
        className={`min-w-0 flex-1 overflow-y-auto relative transition-all duration-300 ${
          isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col">
          {/* Top bar with notifications and settings */}
          <div className="flex items-center justify-between mb-4 gap-2">
            {isMobile ? (
              <button
                type="button"
                className="p-2 rounded-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
                onClick={() => setIsSidebarCollapsed(false)}
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
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
