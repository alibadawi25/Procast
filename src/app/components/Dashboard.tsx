import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Calendar, Search, TrendingUp, TrendingDown, DollarSign, Package, ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { CategorySlicer } from './CategorySlicer';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, Brush } from 'recharts';
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
  { channel: 'Online', revenue: 45200, orders: 1240, avgOrder: 36.45 },
  { channel: 'Retail', revenue: 38900, orders: 890, avgOrder: 43.71 },
  { channel: 'Wholesale', revenue: 28400, orders: 420, avgOrder: 67.62 },
  { channel: 'Partners', revenue: 15600, orders: 310, avgOrder: 50.32 },
];

const forecastAccuracyData = [
  { week: 'Week 1', accuracy: 92.5 },
  { week: 'Week 2', accuracy: 94.2 },
  { week: 'Week 3', accuracy: 91.8 },
  { week: 'Week 4', accuracy: 95.1 },
  { week: 'Week 5', accuracy: 93.7 },
  { week: 'Week 6', accuracy: 94.8 },
];

interface DashboardProps {
  salesGroups: SalesGroup[];
  onTogglePin: (groupId: string) => void;
  isLoading: boolean;
  onNavigate: (section: string) => void;
  currency: 'EGP' | 'USD' | 'EUR';
  units: 'units' | 'cartons';
}

export function Dashboard({ salesGroups, onTogglePin, isLoading, onNavigate, currency, units }: DashboardProps) {
  const [step, setStep] = useState<'select' | 'analytics'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [trendSeriesVisible, setTrendSeriesVisible] = useState({
    target: true,
    sales: true,
  });
  const [showAccuracySeries, setShowAccuracySeries] = useState(true);

  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  }, [currency]);

  const formatCurrencyCompact = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  }, [currency]);

  const unitsLabel = units === 'cartons' ? 'cartons' : 'units';
  const salesTrendRef = useRef<HTMLDivElement | null>(null);
  const forecastVsActualRef = useRef<HTMLDivElement | null>(null);
  const channelPerformanceRef = useRef<HTMLDivElement | null>(null);
  const accuracyTrendRef = useRef<HTMLDivElement | null>(null);

  const filteredGroups = salesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      group.tags.some(tag => selectedCategories.includes(tag));
    const matchesPinned = !pinnedOnly || Boolean(group.isPinned);
    return matchesSearch && matchesCategory && matchesPinned;
  });

  const availableCategories = useMemo(
    () => Array.from(new Set(salesGroups.flatMap((group) => group.tags))).sort(),
    [salesGroups]
  );

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forecasted':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'needs-data':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportPDF = async () => {
    if (!selectedGroup) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const brandPrimary = [26, 58, 82] as const;
    const brandAccent = [232, 220, 200] as const;
    const brandMuted = [246, 248, 251] as const;
    const contentBottom = pageHeight - 36;
    const reportDate = new Date();
    const reportDateLabel = reportDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const reportTimeLabel = reportDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.text('Procast', 14, 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(90);
      doc.text('Sales Group Dashboard Report', 14, 32);
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.setFontSize(14);
      doc.text(title, 14, 46);

      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(`Prepared for: ${selectedGroup.name}`, 14, 56);
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
        doc.setFontSize(8);
        doc.setTextColor(90);
        doc.text(kpi.label, x, footerTop + 6);
        doc.setFontSize(11);
        doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
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

    const drawKpiCards = (startY: number) => {
      const cardGap = 6;
      const cardWidth = (pageWidth - 28 - cardGap * 3) / 4;
      const cardHeight = 24;
      kpis.forEach((kpi, index) => {
        const x = 14 + index * (cardWidth + cardGap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230);
        doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(90);
        doc.text(kpi.label, x + 4, startY + 8);
        doc.setFontSize(12);
        doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
        doc.text(kpi.value, x + 4, startY + 17);
      });
      doc.setTextColor(0);
    };

    doc.setFontSize(12);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('Key Metrics', 14, 118);
    doc.setTextColor(0);
    drawKpiCards(124);

    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('Channel Performance Snapshot', 14, 160);
    doc.setTextColor(0);

    let yPosition = 170;
    channelPerformance.forEach((channel) => {
      doc.text(
        `${channel.channel} - Revenue: ${formatCurrency.format(channel.revenue)} | Orders: ${channel.orders} | Avg Order: ${formatCurrency.format(channel.avgOrder)}`,
        14,
        yPosition
      );
      yPosition += 10;
    });

    addFooterKpis();

    const captureOptions = {
      scale: 2.2,
      backgroundColor: '#ffffff',
      useCORS: true,
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
    } as const;

    const addSectionTitle = (title: string, y: number) => {
      doc.setFontSize(13);
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.text(title, 14, y);
      doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
      doc.line(14, y + 2, 196, y + 2);
      doc.setTextColor(0);
    };

    const addInsightBox = (lines: string[], y: number) => {
      const height = 10 + lines.length * 5;
      doc.setFillColor(brandMuted[0], brandMuted[1], brandMuted[2]);
      doc.setDrawColor(228);
      doc.roundedRect(14, y, pageWidth - 28, height, 2, 2, 'FD');
      doc.setFontSize(9);
      doc.setTextColor(70);
      lines.forEach((line, index) => {
        doc.text(`• ${line}`, 18, y + 6 + index * 5);
      });
      doc.setTextColor(0);
      return y + height + 8;
    };

    const addChartImage = async (
      node: HTMLDivElement | null,
      title: string,
      startY: number,
      insights: string[]
    ) => {
      if (!node) return startY;
      addSectionTitle(title, startY);
      const canvas = await html2canvas(node, captureOptions);
      const imgData = canvas.toDataURL('image/png');
      const maxWidth = pageWidth - 28;
      const imgHeight = (canvas.height * maxWidth) / canvas.width;
      const top = startY + 8;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230);
      doc.roundedRect(12, top - 4, maxWidth + 4, imgHeight + 8, 3, 3, 'FD');
      doc.addImage(imgData, 'PNG', 14, top, maxWidth, imgHeight);

      const afterChart = top + imgHeight + 8;
      return addInsightBox(insights, afterChart);
    };

    doc.addPage();
    addHeader('Visual Insights');
    doc.setFontSize(12);
    doc.setTextColor(90);
    doc.text('Selected charts captured from the live dashboard.', 14, 78);
    doc.setTextColor(0);

    const salesFirst = salesTrendData[0]?.sales ?? 0;
    const salesLast = salesTrendData[salesTrendData.length - 1]?.sales ?? 0;
    const salesDeltaPct = salesFirst ? Math.round(((salesLast - salesFirst) / salesFirst) * 100) : 0;
    const targetGap = salesTrendData.reduce((sum, row) => sum + (row.sales - row.target), 0);
    const forecastAvgDelta = Math.round(
      forecastVsActualData.reduce((sum, row) => sum + (row.forecast - row.sales), 0) / forecastVsActualData.length
    );
    const topChannel = channelPerformance.reduce((top, row) => (row.revenue > top.revenue ? row : top), channelPerformance[0]);
    const avgAccuracy = Math.round(
      forecastAccuracyData.reduce((sum, row) => sum + row.accuracy, 0) / forecastAccuracyData.length
    );

    const ensureSpace = (minHeight: number, currentY: number) => {
      if (currentY + minHeight <= contentBottom) return currentY;
      addFooterKpis();
      doc.addPage();
      addHeader('Visual Insights (cont.)');
      return 84;
    };

    let chartY = 90;
    chartY = ensureSpace(170, chartY);
    chartY = await addChartImage(
      salesTrendRef.current,
      'Sales Trend vs Target',
      chartY,
      [
        `Sales moved ${salesDeltaPct >= 0 ? 'up' : 'down'} ${Math.abs(salesDeltaPct)}% over the period.`,
        `Net gap to target: ${targetGap >= 0 ? '+' : ''}${targetGap.toLocaleString()} units.`,
      ]
    );
    chartY = ensureSpace(170, chartY);
    chartY = await addChartImage(
      forecastVsActualRef.current,
      'Forecast vs Actual',
      chartY,
      [
        `Average forecast delta: ${forecastAvgDelta >= 0 ? '+' : ''}${forecastAvgDelta.toLocaleString()} units.`,
        `Best month: ${forecastVsActualData.reduce((best, row) => (row.sales > best.sales ? row : best), forecastVsActualData[0]).month}.`,
      ]
    );
    chartY = ensureSpace(170, chartY);
    chartY = await addChartImage(
      channelPerformanceRef.current,
      'Channel Performance',
      chartY,
      [
        `Top channel: ${topChannel.channel} (${topChannel.revenue.toLocaleString()} revenue).`,
        `Total revenue: ${formatCurrency.format(channelPerformance.reduce((sum, row) => sum + row.revenue, 0))}.`,
      ]
    );
    chartY = ensureSpace(170, chartY);
    await addChartImage(
      accuracyTrendRef.current,
      'Forecast Accuracy Trend',
      chartY,
      [
        `Average accuracy: ${avgAccuracy}%.`,
        `Best week: ${forecastAccuracyData.reduce((best, row) => (row.accuracy > best.accuracy ? row : best), forecastAccuracyData[0]).week}.`,
      ]
    );
    addFooterKpis();

    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    }
    doc.setTextColor(0);

    doc.save(`${selectedGroup.name}-dashboard-report.pdf`);
  };

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-1">Select a Sales Group to view analytics</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search sales groups by name or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Slicer */}
        <CategorySlicer
          categories={availableCategories}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
        />

        <div className="flex items-center gap-2">
          <Button
            variant={pinnedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPinnedOnly((prev) => !prev)}
            className="gap-2"
          >
            <Star size={14} className={pinnedOnly ? 'fill-current' : ''} />
            Pinned only
          </Button>
        </div>

        {/* Sales Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-4 space-y-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-5 w-24" />
              </Card>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No sales groups found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Try adjusting your search, category, or pinned filter.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategories([]);
                  setPinnedOnly(false);
                }}
              >
                Clear Filters
              </Button>
              <Button onClick={() => onNavigate('upload')}>
                Upload Data
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative group"
                onClick={() => handleSelectGroup(group)}
              >
                <div className={`absolute top-2 right-2 transition-opacity z-10 ${group.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`hover:bg-amber-100 ${group.isPinned ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-600'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(group.id);
                    }}
                    title={group.isPinned ? 'Unpin sales group' : 'Pin sales group'}
                  >
                    <Star size={18} className={group.isPinned ? 'fill-current animate-pinSparkle' : ''} />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className={`secondary-meta flex min-h-[20px] items-center gap-2 text-sm text-muted-foreground ${
                      group.status === 'needs-data' ? 'opacity-0 select-none' : ''
                    }`}
                  >
                    <Calendar size={14} />
                    <span>{group.timeSpan}</span>
                  </div>
                  <div className="secondary-meta text-sm text-muted-foreground">
                    Last upload: {group.lastUpload}
                  </div>
                  <div className="secondary-meta flex flex-wrap gap-2 min-h-[28px]">
                    {group.tags.length > 0 ? (
                      group.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-transparent select-none">No tags</span>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(group.status)} text-xs`}>
                    {group.status.replace('-', ' ')}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => setStep('select')} className="gap-2">
          ← Back to Sales Groups
        </Button>

        <Button onClick={handleExportPDF}>
          Export to PDF
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1>Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">{selectedGroup?.name}</p>
        </div>

        {isAnalyticsLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-3 w-3/4" />
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-4">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-[280px] w-full rounded-lg" />
                </Card>
              ))}
            </div>
            <Card className="p-4 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-[220px] w-full rounded-lg" />
            </Card>
          </div>
        ) : (
          <>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Total Revenue</span>
                  </TooltipTrigger>
                  <TooltipContent>Total sales value for the selected period.</TooltipContent>
                </Tooltip>
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl">{formatCurrencyCompact.format(128100)}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">+15.3% from last period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Units Sold</span>
                  </TooltipTrigger>
                  <TooltipContent>Total units sold for the selected period.</TooltipContent>
                </Tooltip>
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl">
              {(units === 'cartons' ? 286 : 2860).toLocaleString()} {unitsLabel}
            </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">+8.7% from last period</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Growth Rate</span>
                  </TooltipTrigger>
                  <TooltipContent>Percent change compared to the previous period.</TooltipContent>
                </Tooltip>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">+11.4%</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">Best in 6 months</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Forecast Accuracy</span>
                  </TooltipTrigger>
                  <TooltipContent>How close forecasts are to actuals in the period.</TooltipContent>
                </Tooltip>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">94.2%</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">+2.1% improvement</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend vs Target</CardTitle>
              <p className="text-sm text-muted-foreground">Last 6 months performance</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Button size="sm" variant={trendSeriesVisible.target ? 'default' : 'outline'} onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, target: !prev.target }))}>
                  Target
                </Button>
                <Button size="sm" variant={trendSeriesVisible.sales ? 'default' : 'outline'} onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, sales: !prev.sales }))}>
                  Actual
                </Button>
              </div>
              <div ref={salesTrendRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip cursor={{ stroke: '#1a3a52', strokeDasharray: '4 4' }} />
                  <Legend />
                  {trendSeriesVisible.target && (
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#e8dcc8"
                      fill="#e8dcc8"
                      fillOpacity={0.3}
                      name="Target"
                    />
                  )}
                  {trendSeriesVisible.sales && (
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#1a3a52"
                      fill="#1a3a52"
                      fillOpacity={0.5}
                      name="Actual Sales"
                    />
                  )}
                  <Brush dataKey="month" height={18} stroke="#1a3a52" travellerWidth={10} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Forecast vs Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast vs Actual</CardTitle>
              <p className="text-sm text-muted-foreground">Performance comparison - Last 12 months</p>
            </CardHeader>
            <CardContent>
              <div ref={forecastVsActualRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={forecastVsActualData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#1a3a52" name="Actual" />
                  <Bar dataKey="forecast" fill="#e8dcc8" name="Forecast" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Revenue by sales channel</p>
            </CardHeader>
            <CardContent>
              <div ref={channelPerformanceRef}>
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
              </div>
            </CardContent>
          </Card>

          {/* Forecast Accuracy Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Accuracy Trend</CardTitle>
              <p className="text-sm text-muted-foreground">Weekly accuracy performance</p>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Button size="sm" variant={showAccuracySeries ? 'default' : 'outline'} onClick={() => setShowAccuracySeries((prev) => !prev)}>
                  Accuracy
                </Button>
              </div>
              <div ref={accuracyTrendRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecastAccuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" />
                  <YAxis domain={[85, 100]} stroke="#6b7280" />
                  <RechartsTooltip cursor={{ stroke: '#1a3a52', strokeDasharray: '4 4' }} />
                  <Legend />
                  {showAccuracySeries && (
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#10b981' }}
                      name="Accuracy %"
                    />
                  )}
                  <Brush dataKey="week" height={18} stroke="#1a3a52" travellerWidth={10} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance Details</CardTitle>
          </CardHeader>
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
                  {channelPerformance.map((channel, index) => {
                    const totalRevenue = channelPerformance.reduce((sum, c) => sum + c.revenue, 0);
                    const share = ((channel.revenue / totalRevenue) * 100).toFixed(1);
                    
                    return (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3">{channel.channel}</td>
                        <td className="py-3 text-right">{formatCurrency.format(channel.revenue)}</td>
                        <td className="py-3 text-right">{channel.orders.toLocaleString()}</td>
                        <td className="py-3 text-right">{formatCurrency.format(channel.avgOrder)}</td>
                        <td className="py-3 text-right">
                          <Badge variant="secondary">{share}%</Badge>
                        </td>
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
      </div>
    </div>
  );
}
