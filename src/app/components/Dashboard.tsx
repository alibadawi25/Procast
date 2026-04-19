import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Calendar, Search, TrendingUp, TrendingDown, DollarSign, Package, ArrowUpRight, ArrowDownRight, Star, Settings2, X, GripVertical, BarChart2, LineChart as LineIcon, PieChart as PieIcon, Activity, AreaChart as AreaIcon, ScatterChart } from 'lucide-react';
import { CategorySlicer } from './CategorySlicer';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, Brush, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart as RechartsScatterChart, Scatter, ZAxis } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
  isPinned?: boolean;
}

const salesTrendData = [
  { month: 'Jan', sales: 12500, target: 12200, growth: 2.5 },
  { month: 'Feb', sales: 13200, target: 12900, growth: 3.1 },
  { month: 'Mar', sales: 14100, target: 13600, growth: 6.8 },
  { month: 'Apr', sales: 13800, target: 14000, growth: -2.1 },
  { month: 'May', sales: 15200, target: 14800, growth: 5.0 },
  { month: 'Jun', sales: 16400, target: 15800, growth: 7.9 },
  { month: 'Jul', sales: 17100, target: 16500, growth: 3.6 },
  { month: 'Aug', sales: 16800, target: 17000, growth: -1.8 },
  { month: 'Sep', sales: 18200, target: 17500, growth: 8.3 },
  { month: 'Oct', sales: 19500, target: 18000, growth: 7.1 },
  { month: 'Nov', sales: 21000, target: 19500, growth: 7.7 },
  { month: 'Dec', sales: 23400, target: 21000, growth: 11.4 },
];

const forecastVsActualData = [
  { month: 'Jan', sales: 12500, forecast: 12800 },
  { month: 'Feb', sales: 13200, forecast: 13400 },
  { month: 'Mar', sales: 14100, forecast: 14000 },
  { month: 'Apr', sales: 13800, forecast: 13900 },
  { month: 'May', sales: 15200, forecast: 15100 },
  { month: 'Jun', sales: 16400, forecast: 16200 },
  { month: 'Jul', sales: 17100, forecast: 17000 },
  { month: 'Aug', sales: 16800, forecast: 16900 },
  { month: 'Sep', sales: 18200, forecast: 18100 },
  { month: 'Oct', sales: 19500, forecast: 19300 },
  { month: 'Nov', sales: 21000, forecast: 20800 },
  { month: 'Dec', sales: 23400, forecast: 23200 },
];

const channelPerformance = [
  { channel: 'Online',    revenue: 45200, orders: 1240, avgOrder: 36.45 },
  { channel: 'Retail',    revenue: 38900, orders:  890, avgOrder: 43.71 },
  { channel: 'Wholesale', revenue: 28400, orders:  420, avgOrder: 67.62 },
  { channel: 'Partners',  revenue: 15600, orders:  310, avgOrder: 50.32 },
];

const forecastAccuracyData = [
  { week: 'Week 1', accuracy: 92.5 },
  { week: 'Week 2', accuracy: 94.2 },
  { week: 'Week 3', accuracy: 91.8 },
  { week: 'Week 4', accuracy: 95.1 },
  { week: 'Week 5', accuracy: 93.7 },
  { week: 'Week 6', accuracy: 94.8 },
];

const productMixData = [
  { name: 'Milk',        value: 4200, percentage: 35 },
  { name: 'Juice',       value: 3200, percentage: 27 },
  { name: 'Yogurt',      value: 2400, percentage: 20 },
  { name: 'Butter',      value: 1400, percentage: 12 },
  { name: 'importation', value:  800, percentage:  6 },
];

const monthlyGrowthData = [
  { month: 'Jan', growth: 2.5 },
  { month: 'Feb', growth: 3.1 },
  { month: 'Mar', growth: 6.8 },
  { month: 'Apr', growth: -2.1 },
  { month: 'May', growth: 5.0 },
  { month: 'Jun', growth: 7.9 },
  { month: 'Jul', growth: 3.6 },
  { month: 'Aug', growth: -1.8 },
  { month: 'Sep', growth: 8.3 },
  { month: 'Oct', growth: 7.1 },
  { month: 'Nov', growth: 7.7 },
  { month: 'Dec', growth: 11.4 },
];

const radarData = [
  { metric: 'Accuracy',    value: 94 },
  { metric: 'Growth',      value: 78 },
  { metric: 'Coverage',    value: 85 },
  { metric: 'Consistency', value: 88 },
  { metric: 'Efficiency',  value: 72 },
  { metric: 'Stability',   value: 91 },
];

const volumeVsPriceData = [
  { volume: 1200, price: 28, month: 'Jan' },
  { volume: 1350, price: 26, month: 'Feb' },
  { volume: 1480, price: 30, month: 'Mar' },
  { volume: 1420, price: 29, month: 'Apr' },
  { volume: 1600, price: 27, month: 'May' },
  { volume: 1720, price: 31, month: 'Jun' },
  { volume: 1800, price: 33, month: 'Jul' },
  { volume: 1750, price: 32, month: 'Aug' },
  { volume: 1900, price: 35, month: 'Sep' },
  { volume: 2050, price: 34, month: 'Oct' },
  { volume: 2200, price: 36, month: 'Nov' },
  { volume: 2450, price: 38, month: 'Dec' },
];

const COLORS = ['#1a3a52', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// ── Chart registry ────────────────────────────────────────────────────────────
type ChartId =
  | 'salesTrend'
  | 'forecastVsActual'
  | 'channelPerformance'
  | 'accuracyTrend'
  | 'productMix'
  | 'monthlyGrowth'
  | 'performanceRadar';

interface ChartDef {
  id: ChartId;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}

const DEFAULT_LAYOUT: ChartId[] = [
  'salesTrend',
  'forecastVsActual',
  'channelPerformance',
  'accuracyTrend',
];

interface DashboardProps {
  salesGroups: SalesGroup[];
  onTogglePin: (groupId: string) => void;
  isLoading: boolean;
  onNavigate: (section: string) => void;
  currency: 'EGP' | 'USD' | 'EUR';
  units: 'units' | 'cartons';
}

// ── Individual chart renderers ────────────────────────────────────────────────
function ChartSalesTrend({ currency: _c }: { currency: string }) {
  const [visible, setVisible] = useState({ sales: true, target: true });
  return (
    <>
      <div className="flex gap-2 mb-3">
        <Button size="sm" variant={visible.target ? 'default' : 'outline'} onClick={() => setVisible(p => ({ ...p, target: !p.target }))}>Target</Button>
        <Button size="sm" variant={visible.sales  ? 'default' : 'outline'} onClick={() => setVisible(p => ({ ...p, sales:  !p.sales  }))}>Actual</Button>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={salesTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <RechartsTooltip cursor={{ stroke: '#1a3a52', strokeDasharray: '4 4' }} />
          <Legend />
          {visible.target && <Area type="monotone" dataKey="target" stroke="#e8dcc8" fill="#e8dcc8" fillOpacity={0.3} name="Target" />}
          {visible.sales  && <Area type="monotone" dataKey="sales"  stroke="#1a3a52" fill="#1a3a52" fillOpacity={0.5} name="Actual Sales" />}
          <Brush dataKey="month" height={18} stroke="#1a3a52" travellerWidth={10} />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function ChartForecastVsActual() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={forecastVsActualData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <RechartsTooltip />
        <Legend />
        <Bar dataKey="sales"    fill="#1a3a52" name="Actual" />
        <Bar dataKey="forecast" fill="#e8dcc8" name="Forecast" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartChannelPerformance({ currency }: { currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={channelPerformance}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="channel" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <RechartsTooltip />
        <Legend />
        <Bar dataKey="revenue" fill="#1a3a52" name={`Revenue (${currency})`} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartAccuracyTrend() {
  const [show, setShow] = useState(true);
  return (
    <>
      <div className="mb-3">
        <Button size="sm" variant={show ? 'default' : 'outline'} onClick={() => setShow(p => !p)}>Accuracy</Button>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={forecastAccuracyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="week" stroke="#6b7280" />
          <YAxis domain={[85, 100]} stroke="#6b7280" />
          <RechartsTooltip cursor={{ stroke: '#1a3a52', strokeDasharray: '4 4' }} />
          <Legend />
          {show && <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} name="Accuracy %" />}
          <Brush dataKey="week" height={18} stroke="#1a3a52" travellerWidth={10} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

function ChartProductMix() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={productMixData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name} ${percentage}%`} outerRadius={100} dataKey="value">
          {productMixData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <RechartsTooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartMonthlyGrowth() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthlyGrowthData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" tickFormatter={v => `${v}%`} />
        <RechartsTooltip formatter={(v: number) => [`${v}%`, 'Growth']} />
        <Legend />
        <Bar dataKey="growth" name="Monthly Growth %" radius={[4, 4, 0, 0]}>
          {monthlyGrowthData.map((d, i) => <Cell key={i} fill={d.growth >= 0 ? '#10b981' : '#ef4444'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartPerformanceRadar() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <Radar name="Performance" dataKey="value" stroke="#1a3a52" fill="#1a3a52" fillOpacity={0.35} />
        <RechartsTooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Mini previews shown in the customiser panel
const MiniBar = () => (
  <svg viewBox="0 0 40 28" className="w-full h-full">
    {[6,10,7,14,9,12].map((h, i) => (
      <rect key={i} x={i*6+1} y={28-h*1.8} width={4} height={h*1.8} fill="#1a3a52" rx="1" />
    ))}
  </svg>
);
const MiniLine = () => (
  <svg viewBox="0 0 40 28" className="w-full h-full">
    <polyline points="2,22 8,16 14,18 20,10 26,12 32,6 38,8" fill="none" stroke="#1a3a52" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const MiniArea = () => (
  <svg viewBox="0 0 40 28" className="w-full h-full">
    <polygon points="2,24 8,16 14,18 20,10 26,12 32,6 38,8 38,24" fill="#1a3a52" fillOpacity="0.25" />
    <polyline points="2,24 8,16 14,18 20,10 26,12 32,6 38,8" fill="none" stroke="#1a3a52" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const MiniPie = () => (
  <svg viewBox="0 0 28 28" className="w-full h-full">
    <circle cx="14" cy="14" r="11" fill="none" stroke="#1a3a52" strokeWidth="7" strokeDasharray="22 48" />
    <circle cx="14" cy="14" r="11" fill="none" stroke="#3b82f6" strokeWidth="7" strokeDasharray="14 56" strokeDashoffset="-22" />
    <circle cx="14" cy="14" r="11" fill="none" stroke="#10b981" strokeWidth="7" strokeDasharray="10 60" strokeDashoffset="-36" />
  </svg>
);
const MiniRadar = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <polygon points="16,4 26,11 22,23 10,23 6,11" fill="#1a3a52" fillOpacity="0.2" stroke="#1a3a52" strokeWidth="1.5" />
    <polygon points="16,8 22,13 19,21 13,21 10,13" fill="#1a3a52" fillOpacity="0.35" stroke="#1a3a52" strokeWidth="1" />
  </svg>
);
const MiniGroupedBar = () => (
  <svg viewBox="0 0 40 28" className="w-full h-full">
    {[0,1,2,3].map(i => (
      <g key={i}>
        <rect x={i*9+1} y={28-[8,12,9,14][i]*1.7} width={3.5} height={[8,12,9,14][i]*1.7} fill="#1a3a52" rx="1" />
        <rect x={i*9+5} y={28-[6,9,11,10][i]*1.7} width={3.5} height={[6,9,11,10][i]*1.7} fill="#e8dcc8" rx="1" />
      </g>
    ))}
  </svg>
);

export function Dashboard({ salesGroups, onTogglePin, isLoading, onNavigate, currency, units }: DashboardProps) {
  const [step, setStep] = useState<'select' | 'analytics'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [showCustomiser, setShowCustomiser] = useState(false);
  const [layout, setLayout] = useState<ChartId[]>(DEFAULT_LAYOUT);
  const [pendingLayout, setPendingLayout] = useState<(ChartId | null)[]>([...DEFAULT_LAYOUT]);
  const [dragSource, setDragSource] = useState<{ from: 'sidebar' | 'slot'; id: ChartId; slotIndex?: number } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const chartDefs: ChartDef[] = [
    {
      id: 'salesTrend',
      label: 'Sales Trend vs Target',
      description: 'Area chart — actual vs target over 12 months',
      icon: <div className="w-10 h-7"><MiniArea /></div>,
      preview: <div className="w-10 h-7"><MiniArea /></div>,
    },
    {
      id: 'forecastVsActual',
      label: 'Forecast vs Actual',
      description: 'Grouped bar — forecast accuracy comparison',
      icon: <div className="w-10 h-7"><MiniGroupedBar /></div>,
      preview: <div className="w-10 h-7"><MiniGroupedBar /></div>,
    },
    {
      id: 'channelPerformance',
      label: 'Channel Performance',
      description: 'Bar chart — revenue by sales channel',
      icon: <div className="w-10 h-7"><MiniBar /></div>,
      preview: <div className="w-10 h-7"><MiniBar /></div>,
    },
    {
      id: 'accuracyTrend',
      label: 'Forecast Accuracy Trend',
      description: 'Line chart — weekly accuracy over time',
      icon: <div className="w-10 h-7"><MiniLine /></div>,
      preview: <div className="w-10 h-7"><MiniLine /></div>,
    },
    {
      id: 'productMix',
      label: 'Product Mix',
      description: 'Pie chart — revenue share by category',
      icon: <div className="w-7 h-7"><MiniPie /></div>,
      preview: <div className="w-7 h-7"><MiniPie /></div>,
    },
    {
      id: 'monthlyGrowth',
      label: 'Monthly Growth Rate',
      description: 'Colour-coded bar — positive/negative growth per month',
      icon: <div className="w-10 h-7"><MiniBar /></div>,
      preview: <div className="w-10 h-7"><MiniBar /></div>,
    },
    {
      id: 'performanceRadar',
      label: 'Performance Radar',
      description: 'Radar chart — multi-metric performance overview',
      icon: <div className="w-7 h-7"><MiniRadar /></div>,
      preview: <div className="w-7 h-7"><MiniRadar /></div>,
    },
  ];

  const formatCurrency = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }), [currency]);
  const formatCurrencyCompact = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }), [currency]);
  const unitsLabel = units === 'cartons' ? 'cartons' : 'units';

  const salesTrendRef = useRef<HTMLDivElement | null>(null);
  const forecastVsActualRef = useRef<HTMLDivElement | null>(null);
  const channelPerformanceRef = useRef<HTMLDivElement | null>(null);
  const accuracyTrendRef = useRef<HTMLDivElement | null>(null);

  const filteredGroups = salesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || group.tags.some(tag => selectedCategories.includes(tag));
    const matchesPinned = !pinnedOnly || Boolean(group.isPinned);
    return matchesSearch && matchesCategory && matchesPinned;
  });

  const availableCategories = useMemo(() => Array.from(new Set(salesGroups.flatMap(g => g.tags))).sort(), [salesGroups]);

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setStep('analytics');
    setIsAnalyticsLoading(true);
  };

  useEffect(() => {
    if (step !== 'analytics') return;
    const timer = setTimeout(() => setIsAnalyticsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [step]);

  // ── Customiser helpers ──────────────────────────────────────────────────────
  const openCustomiser = () => {
    setPendingLayout([...layout]);
    setShowCustomiser(true);
  };

  const applyLayout = () => {
    const filled = pendingLayout.filter((id): id is ChartId => id !== null);
    setLayout(filled.slice(0, 4));
    setShowCustomiser(false);
  };

  const usedInPending = pendingLayout.filter((id): id is ChartId => id !== null);
  const sidebarCharts = chartDefs.filter(c => !usedInPending.includes(c.id));

  // drag from sidebar
  const handleSidebarDragStart = (id: ChartId) => {
    setDragSource({ from: 'sidebar', id });
  };

  // drag from an existing slot
  const handleSlotDragStart = (id: ChartId, slotIndex: number) => {
    setDragSource({ from: 'slot', id, slotIndex });
  };

  const handleDropOnSlot = (slotIndex: number) => {
    if (!dragSource) return;
    const next = [...pendingLayout] as (ChartId | null)[];

    if (dragSource.from === 'sidebar') {
      // if slot already occupied, push existing back to sidebar (just remove from slot)
      next[slotIndex] = dragSource.id;
    } else if (dragSource.from === 'slot' && dragSource.slotIndex !== undefined) {
      const prev = next[slotIndex];
      next[slotIndex] = dragSource.id;
      next[dragSource.slotIndex] = prev ?? null;
    }
    setPendingLayout(next);
    setDragSource(null);
    setDragOverSlot(null);
  };

  const handleDropOnSidebar = () => {
    if (!dragSource || dragSource.from !== 'slot') return;
    const next = [...pendingLayout] as (ChartId | null)[];
    if (dragSource.slotIndex !== undefined) next[dragSource.slotIndex] = null;
    setPendingLayout(next);
    setDragSource(null);
  };

  const removeFromSlot = (slotIndex: number) => {
    const next = [...pendingLayout] as (ChartId | null)[];
    next[slotIndex] = null;
    setPendingLayout(next);
  };

  // ── Chart renderer ──────────────────────────────────────────────────────────
  const getChartLabel = (id: ChartId) => chartDefs.find(c => c.id === id)?.label ?? id;
  const getChartDescription = (id: ChartId) => chartDefs.find(c => c.id === id)?.description ?? '';

  const renderChart = (id: ChartId) => {
    switch (id) {
      case 'salesTrend':          return <ChartSalesTrend currency={currency} />;
      case 'forecastVsActual':    return <ChartForecastVsActual />;
      case 'channelPerformance':  return <ChartChannelPerformance currency={currency} />;
      case 'accuracyTrend':       return <ChartAccuracyTrend />;
      case 'productMix':          return <ChartProductMix />;
      case 'monthlyGrowth':       return <ChartMonthlyGrowth />;
      case 'performanceRadar':    return <ChartPerformanceRadar />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forecasted':  return 'bg-green-100 text-green-800';
      case 'ready':       return 'bg-blue-100 text-blue-800';
      case 'needs-data':  return 'bg-amber-100 text-amber-800';
      default:            return 'bg-gray-100 text-gray-800';
    }
  };

  // ── PDF export (unchanged logic) ────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!selectedGroup) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const brandPrimary = [26, 58, 82] as const;
    const brandAccent  = [232, 220, 200] as const;
    const brandMuted   = [246, 248, 251] as const;
    const contentBottom = pageHeight - 36;
    const reportDate = new Date();
    const reportDateLabel = reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportTimeLabel = reportDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const kpis = [
      { label: 'Total Revenue', value: formatCurrencyCompact.format(128100) },
      { label: 'Units Sold', value: `${(units === 'cartons' ? 286 : 2860).toLocaleString()} ${unitsLabel}` },
      { label: 'Growth Rate', value: '+11.4%' },
      { label: 'Forecast Accuracy', value: '94.2%' },
    ];
    const addHeader = (title: string) => {
      doc.setFillColor(brandMuted[0], brandMuted[1], brandMuted[2]);
      doc.rect(0, 0, pageWidth, 70, 'F');
      doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
      doc.line(0, 70, pageWidth, 70);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.text('Procast', 14, 22);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(90);
      doc.text('Sales Group Dashboard Report', 14, 32);
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.setFontSize(14); doc.text(title, 14, 46);
      doc.setFontSize(10); doc.setTextColor(90);
      doc.text(`Prepared for: ${selectedGroup!.name}`, 14, 56);
      doc.text(`Prepared by: Procast Analytics`, 14, 61);
      doc.text(`Generated: ${reportDateLabel} • ${reportTimeLabel}`, 14, 66);
      doc.setTextColor(0);
    };
    const addFooterKpis = () => {
      const footerTop = pageHeight - 28;
      doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
      doc.setFillColor(brandMuted[0], brandMuted[1], brandMuted[2]);
      doc.roundedRect(14, footerTop, pageWidth - 28, 18, 2, 2, 'FD');
      const columnWidth = (pageWidth - 28) / kpis.length;
      kpis.forEach((kpi, index) => {
        const x = 14 + index * columnWidth + 3;
        doc.setFontSize(8); doc.setTextColor(90); doc.text(kpi.label, x, footerTop + 6);
        doc.setFontSize(11); doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
        doc.text(kpi.value, x, footerTop + 13);
      });
      doc.setTextColor(0);
    };
    addHeader('Executive Summary');
    doc.setFontSize(14);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text(`Sales Group: ${selectedGroup.name}`, 14, 84);
    doc.setTextColor(0);
    doc.text(`Time Span: ${selectedGroup.timeSpan}`, 14, 94);
    doc.text(`Status: ${selectedGroup.status}`, 14, 104);
    addFooterKpis();
    doc.save(`${selectedGroup.name}-dashboard-report.pdf`);
  };

  // ── SELECT STEP ─────────────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-1">Select a Sales Group to view analytics</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input placeholder="Search sales groups by name or Category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <CategorySlicer categories={availableCategories} selectedCategories={selectedCategories} onCategoryChange={setSelectedCategories} />
        <div className="flex items-center gap-2">
          <Button variant={pinnedOnly ? 'default' : 'outline'} size="sm" onClick={() => setPinnedOnly(p => !p)} className="gap-2">
            <Star size={14} className={pinnedOnly ? 'fill-current' : ''} />Pinned only
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-4">
                <Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
                <Skeleton className="h-5 w-24" />
              </Card>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted p-4 mb-4"><Search className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold mb-2">No sales groups found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">Try adjusting your search, category, or pinned filter.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategories([]); setPinnedOnly(false); }}>Clear Filters</Button>
              <Button onClick={() => onNavigate('upload')}>Upload Data</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative group" onClick={() => handleSelectGroup(group)}>
                <div className={`absolute top-2 right-2 transition-opacity z-10 ${group.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Button variant="ghost" size="icon" className={`hover:bg-amber-100 ${group.isPinned ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-600'}`} onClick={(e) => { e.stopPropagation(); onTogglePin(group.id); }} title={group.isPinned ? 'Unpin' : 'Pin'}>
                    <Star size={18} className={group.isPinned ? 'fill-current animate-pinSparkle' : ''} />
                  </Button>
                </div>
                <CardHeader><CardTitle className="text-base">{group.name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className={`secondary-meta flex min-h-[20px] items-center gap-2 text-sm text-muted-foreground ${group.status === 'needs-data' ? 'opacity-0 select-none' : ''}`}>
                    <Calendar size={14} /><span>{group.timeSpan}</span>
                  </div>
                  <div className="secondary-meta text-sm text-muted-foreground">Last upload: {group.lastUpload}</div>
                  <div className="secondary-meta flex flex-wrap gap-2 min-h-[28px]">
                    {group.tags.length > 0 ? group.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>) : <span className="text-xs text-transparent select-none">No tags</span>}
                  </div>
                  <Badge className={`${getStatusColor(group.status)} text-xs`}>{group.status.replace('-', ' ')}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── ANALYTICS STEP ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => setStep('select')} className="gap-2">← Back to Sales Groups</Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={openCustomiser}>
            <Settings2 size={16} />Customise Layout
          </Button>
          <Button onClick={handleExportPDF}>Export to PDF</Button>
        </div>
      </div>

      <div>
        <h1>Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">{selectedGroup?.name}</p>
      </div>

      {isAnalyticsLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4 space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-3 w-3/4" /></Card>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4 space-y-4"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-[280px] w-full rounded-lg" /></Card>)}
          </div>
        </div>
      ) : (
        <>
          {/* KPI cards — untouched */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm"><Tooltip><TooltipTrigger asChild><span className="cursor-help">Total Revenue</span></TooltipTrigger><TooltipContent>Total sales value for the selected period.</TooltipContent></Tooltip></CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{formatCurrencyCompact.format(128100)}</div>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3 text-green-600" /><p className="text-xs text-green-600">+15.3% from last period</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm"><Tooltip><TooltipTrigger asChild><span className="cursor-help">Units Sold</span></TooltipTrigger><TooltipContent>Total units sold for the selected period.</TooltipContent></Tooltip></CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{(units === 'cartons' ? 286 : 2860).toLocaleString()} {unitsLabel}</div>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3 text-green-600" /><p className="text-xs text-green-600">+8.7% from last period</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm"><Tooltip><TooltipTrigger asChild><span className="cursor-help">Growth Rate</span></TooltipTrigger><TooltipContent>Percent change compared to the previous period.</TooltipContent></Tooltip></CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">+11.4%</div>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3 text-green-600" /><p className="text-xs text-green-600">Best in 6 months</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm"><Tooltip><TooltipTrigger asChild><span className="cursor-help">Forecast Accuracy</span></TooltipTrigger><TooltipContent>How close forecasts are to actuals in the period.</TooltipContent></Tooltip></CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">94.2%</div>
                <div className="flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3 text-green-600" /><p className="text-xs text-green-600">+2.1% improvement</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Dynamic chart grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {layout.map((chartId) => (
              <Card key={chartId}>
                <CardHeader>
                  <CardTitle>{getChartLabel(chartId)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getChartDescription(chartId)}</p>
                </CardHeader>
                <CardContent>{renderChart(chartId)}</CardContent>
              </Card>
            ))}
          </div>

          {/* Channel table — kept as-is */}
          <Card>
            <CardHeader><CardTitle>Channel Performance Details</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-medium">Channel</th>
                      <th className="pb-3 font-medium text-right">Revenue</th>
                      <th className="pb-3 font-medium text-right">Orders</th>
                      <th className="pb-3 font-medium text-right">Avg Order Value</th>
                      <th className="pb-3 font-medium text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerformance.map((ch, i) => {
                      const total = channelPerformance.reduce((s, c) => s + c.revenue, 0);
                      return (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="py-3">{ch.channel}</td>
                          <td className="py-3 text-right">{formatCurrency.format(ch.revenue)}</td>
                          <td className="py-3 text-right">{ch.orders.toLocaleString()}</td>
                          <td className="py-3 text-right">{formatCurrency.format(ch.avgOrder)}</td>
                          <td className="py-3 text-right"><Badge variant="secondary">{((ch.revenue / total) * 100).toFixed(1)}%</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── CUSTOMISER MODAL ─────────────────────────────────────────────────── */}
      {showCustomiser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCustomiser(false)} />

          {/* Panel */}
          <div className="relative z-10 bg-background border border-border rounded-xl shadow-2xl flex overflow-hidden"
               style={{ width: 'min(92vw, 920px)', height: 'min(90vh, 640px)' }}>

            {/* ── Main canvas area ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto"
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDropOnSidebar}>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Customise Dashboard Layout</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag charts from the panel on the right into the 4 slots below. Drag a chart out of a slot to remove it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                {Array.from({ length: 4 }).map((_, slotIndex) => {
                  const occupant = pendingLayout[slotIndex] ?? null;
                  const isOver = dragOverSlot === slotIndex;
                  return (
                    <div
                      key={slotIndex}
                      className={`relative rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center min-h-[160px] select-none
                        ${isOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border bg-muted/30 hover:border-primary/40'}
                        ${occupant ? 'border-solid border-border bg-card' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slotIndex); }}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => { e.stopPropagation(); handleDropOnSlot(slotIndex); }}
                    >
                      {occupant ? (
                        <>
                          {/* Remove button */}
                          <button
                            className="absolute top-2 right-2 rounded-full p-0.5 bg-muted hover:bg-destructive/10 hover:text-destructive transition-colors z-10"
                            onClick={() => removeFromSlot(slotIndex)}
                            title="Remove chart"
                          >
                            <X size={14} />
                          </button>
                          {/* Drag handle */}
                          <div
                            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors z-10"
                            draggable
                            onDragStart={() => handleSlotDragStart(occupant, slotIndex)}
                            title="Drag to reorder"
                          >
                            <GripVertical size={14} />
                          </div>
                          <div className="flex flex-col items-center gap-2 px-6 pt-4 pb-3 text-center pointer-events-none">
                            <div className="opacity-70">
                              {chartDefs.find(c => c.id === occupant)?.icon}
                            </div>
                            <p className="text-sm font-medium leading-tight">{getChartLabel(occupant)}</p>
                            <p className="text-xs text-muted-foreground leading-snug">{getChartDescription(occupant)}</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground pointer-events-none px-4 text-center">
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
                            <span className="text-lg leading-none">+</span>
                          </div>
                          <p className="text-xs">Drop a chart here</p>
                          <p className="text-[11px] text-muted-foreground/60">Slot {slotIndex + 1}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => { setPendingLayout([...DEFAULT_LAYOUT]); }}>Reset to Default</Button>
                <Button variant="ghost" onClick={() => setShowCustomiser(false)}>Cancel</Button>
                <Button onClick={applyLayout} disabled={pendingLayout.filter(Boolean).length === 0}>
                  Apply Layout
                </Button>
              </div>
            </div>

            {/* ── Right sidebar — chart picker ──────────────────────────────── */}
            <div className="w-64 border-l border-border bg-muted/20 flex flex-col"
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDropOnSidebar}>
              <div className="p-4 border-b border-border">
                <p className="text-sm font-semibold">Available Charts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Drag into a slot to add</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sidebarCharts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    All charts are placed.<br />Remove one from a slot to swap it.
                  </div>
                ) : (
                  sidebarCharts.map((chart) => (
                    <div
                      key={chart.id}
                      draggable
                      onDragStart={() => handleSidebarDragStart(chart.id)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm transition-all duration-150 select-none"
                    >
                      <div className="shrink-0 w-10 h-8 flex items-center justify-center bg-muted rounded">
                        {chart.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight truncate">{chart.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{chart.description}</p>
                      </div>
                      <GripVertical size={14} className="shrink-0 text-muted-foreground/50" />
                    </div>
                  ))
                )}
              </div>

              {/* Close button */}
              <button
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                onClick={() => setShowCustomiser(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}