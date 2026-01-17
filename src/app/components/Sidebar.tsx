import { LayoutDashboard, Upload, TrendingUp, MessageSquare, History, LogOut, LayoutGrid, Star, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'proask', label: 'ProAsk', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
  ];

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className={`h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo & Collapse Toggle */}
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <h1 className={`text-sidebar-primary text-2xl tracking-tight ${collapsed ? 'hidden' : ''}`}>Procast</h1>
        <button
          className="p-2 rounded hover:bg-sidebar-accent/50 transition-all duration-200 transform hover:scale-110"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Favorites / Quick Links */}
      {!collapsed && favorites.length > 0 && (
        <div className="p-5 border-b border-sidebar-border space-y-3">
          <p className="text-xs text-sidebar-foreground/60">Favorites</p>
          {favorites.map(favId => {
            const item = navItems.find(n => n.id === favId);
            if (!item) return null;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sidebar-primary bg-sidebar-accent transition-all duration-200 transform hover:scale-105 hover:shadow-sm"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <div key={item.id} className="flex items-center justify-between relative group">
              <button
                onClick={() => onSectionChange(item.id)}
                className={`flex-1 flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 transform ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-md scale-105'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-primary hover:shadow-sm hover:scale-105'
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-2 whitespace-nowrap rounded bg-sidebar-accent text-sidebar-primary px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </span>
              )}

              {!collapsed && (
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="ml-2 p-1 rounded hover:bg-sidebar-accent/30 transition-all duration-200 transform hover:scale-110"
                >
                  <Star size={16} className={favorites.includes(item.id) ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'} />
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {activeSection === 'forecast' && !collapsed && (
        <div className="p-4 border-t border-sidebar-border text-sm text-sidebar-foreground/70 space-y-3">
          <p className="mb-1 text-center font-semibold">Forecast Summary</p>
          
          <div className="grid grid-cols-1 gap-1">
            <div className="p-2 border border-sidebar-border rounded flex items-center justify-between text-xs">
              <span>Total Sales Groups</span>
              <span className="font-semibold">6</span>
            </div>
            <div className="p-2 border border-sidebar-border rounded flex items-center justify-between text-xs">
              <span>Peak Month Forecast</span>
              <span className="font-semibold">December</span>
            </div>
            <div className="p-2 border border-sidebar-border rounded flex items-center justify-between text-xs">
              <span>Average Forecast Uncertainty</span>
              <span className="font-semibold">±8.2%</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-6 py-4 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
        
        <div className="flex items-center gap-3 px-4 py-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              YE
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">Yussef Ehab</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">yussef@ProCast.org</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}