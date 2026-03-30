import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Calendar, Search, TrendingUp, ChevronRight, Download, Save, Star, Trophy, Medal, Award } from 'lucide-react';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, ComposedChart, Brush } from 'recharts';
import { CategorySlicer } from './CategorySlicer';
import type { UploadSession } from '../App';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── API types ────────────────────────────────────────────────────────────────
interface ForecastPoint {
  date: string;  
  baseline: number; // Placeholder until API provides baseline     // "2024-01"
  correction: number; // Placeholder until API provides correction
  final: number;
  lower: number;
  upper: number;
}

interface ForecastApiResponse {
  upload_id: string;
  horizon: number;
  promotion: number;
  forecast: ForecastPoint[];
}

// Shape the chart + table consume
interface ChartRow {
  month: string;
  baseline: number;   // "Jan 2024"
  correction: number;
  final: number;
  lower: number;
  upper: number;
}

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
  isPinned?: boolean;
}

interface ForecastProps {
  salesGroups: SalesGroup[];
  onTogglePin: (groupId: string) => void;
  isLoading: boolean;
  onNavigate: (section: string) => void;
  uploadSessionsByGroup: Record<string, UploadSession>;
  onClearUploadSession: (groupId: string) => void;
  onForecastSuccess: (groupIds: string[]) => void;
  currency: 'EGP' | 'USD' | 'EUR';
  units: 'units' | 'cartons';
}

// ── helpers ──────────────────────────────────────────────────────────────────
const horizonToMonths: Record<string, number> = {
  '1-month': 1,
  '3-months': 3,
  '6-months': 6,
  '1-year': 12,
};

function formatMonthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split('-');
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatCountdown(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function mapApiToChartRows(points: ForecastPoint[]): ChartRow[] {
  return points.map((p) => ({
    month: formatMonthLabel(p.date),
    baseline: p.baseline, // Placeholder until API provides baseline
    correction: p.correction, // Placeholder until API provides correction
    final: p.final,
    lower: p.lower,
    upper: p.upper,
  }));
}

function exportToExcel(rows: ChartRow[], groupName: string, horizon: string, promotion: number, unitsLabel: string) {
  const data = rows.map((r) => [
    r.month,
    Math.round(r.final).toLocaleString(),
    Math.round(r.lower).toLocaleString(),
    Math.round(r.upper).toLocaleString(),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([['Date', 'Value', 'Lower', 'Upper'], ...data]);
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '1A3A52' } },
    alignment: { horizontal: 'center' },
  };
  ['A1', 'B1', 'C1', 'D1'].forEach((cell) => {
    if (ws[cell]) ws[cell].s = headerStyle;
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Forecast');
  XLSX.writeFile(wb, `forecast_${groupName}_${horizon}_promo${promotion}.xlsx`);
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return {
      label: '1st',
      className:
        'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-900 border border-amber-300 shadow-sm',
      Icon: Trophy,
    };
  }
  if (rank === 2) {
    return {
      label: '2nd',
      className:
        'bg-gradient-to-r from-slate-200 to-slate-100 text-slate-800 border border-slate-300 shadow-sm',
      Icon: Medal,
    };
  }
  return {
    label: '3rd',
    className:
      'bg-gradient-to-r from-orange-200 to-orange-100 text-orange-900 border border-orange-300 shadow-sm',
    Icon: Award,
  };
}

export function Forecast({
  salesGroups,
  onTogglePin,
  isLoading,
  onNavigate,
  uploadSessionsByGroup,
  onClearUploadSession,
  onForecastSuccess,
  units,
}: ForecastProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'results'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<'1-month' | '3-months' | '6-months' | '1-year'>('1-year');
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [includePromotion, setIncludePromotion] = useState(false);
  const [promotionPercent, setPromotionPercent] = useState(0);
  const [includeDistributionCenters, setIncludeDistributionCenters] = useState(false);
  const [distributionCenters, setDistributionCenters] = useState(12);
  const [hasAppliedSmartDefaults, setHasAppliedSmartDefaults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [forecastRows, setForecastRows] = useState<ChartRow[]>([]);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [appliedPromotion, setAppliedPromotion] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [scenarioEnabled, setScenarioEnabled] = useState(false);
  const [scenarioPromotion, setScenarioPromotion] = useState(0);
  const [scenarioPrice, setScenarioPrice] = useState(0);
  const [scenarioDistribution, setScenarioDistribution] = useState(0);
  const [mainSeriesVisible, setMainSeriesVisible] = useState({
    historical: true,
    baseline: true,
    final: true,
    band: true,
  });
  const [compareSeriesVisible, setCompareSeriesVisible] = useState({
    groupA: true,
    groupB: true,
  });
  const unitsLabel = units === 'cartons' ? 'cartons' : 'units';
  const activeUploadSession = selectedGroup ? uploadSessionsByGroup[selectedGroup.id] ?? null : null;

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

  const selectedCompareGroups = salesGroups.filter((group) => compareSelection.includes(group.id));

  // Compare mode uses real forecast rows offset for group B (mock delta until API supports multi)
  const compareForecastData = forecastRows.map((point, index) => ({
    month: point.month,
    groupA: point.final,
    groupB: Math.round(point.final * (0.9 + ((index % 4) * 0.03))),
  }));

  const scenarioMultiplier = useMemo(() => {
    const promo = scenarioPromotion / 100;
    const price = scenarioPrice / 100;
    const dist = scenarioDistribution / 100;
    return 1 + promo - price + dist;
  }, [scenarioPromotion, scenarioPrice, scenarioDistribution]);

  const scenarioRows = useMemo(() => {
    return forecastRows.map((row) => ({
      ...row,
      final: Math.round(row.final * scenarioMultiplier),
      upper: Math.round(row.upper * scenarioMultiplier),
      lower: Math.round(row.lower * scenarioMultiplier),
    }));
  }, [forecastRows, scenarioMultiplier]);

  const displayedRows = scenarioEnabled ? scenarioRows : forecastRows;
  const top3RankByIndex = useMemo(() => {
    const ranked = displayedRows
      .map((row, index) => ({ index, value: row.final }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    const rankMap = new Map<number, number>();
    ranked.forEach((item, rank) => {
      rankMap.set(item.index, rank + 1);
    });
    return rankMap;
  }, [displayedRows]);

  // Countdown ticker
  useEffect(() => {
    if (!activeUploadSession) return;
    const tick = () => setCountdown(formatCountdown(activeUploadSession.expiresAt));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [activeUploadSession]);

  const handleSelectGroup = (group: SalesGroup) => {
    if (compareMode) {
      setCompareSelection((prev) => {
        if (prev.includes(group.id)) return prev.filter((id) => id !== group.id);
        if (prev.length >= 2) return prev;
        return [...prev, group.id];
      });
      return;
    }
    setForecastError(null);
    setSelectedGroup(group);
    setHasAppliedSmartDefaults(false);
    setStep('configure');
  };

  const handleStartCompare = () => {
    if (compareSelection.length !== 2) return;
    const [groupAId, groupBId] = compareSelection;
    if (!uploadSessionsByGroup[groupAId] || !uploadSessionsByGroup[groupBId]) {
      setForecastError('Both Sales Groups need uploads before comparison.');
      return;
    }
    const groupA = salesGroups.find((group) => group.id === groupAId) ?? null;
    setSelectedGroup(groupA);
    setHasAppliedSmartDefaults(false);
    setForecastError(null);
    setStep('configure');
  };

  useEffect(() => {
    if (step !== 'configure') return;
    if (!activeUploadSession) return;
    if (hasAppliedSmartDefaults) return;
    setIncludePrice(activeUploadSession.hasPrice);
    setIncludePromotion(activeUploadSession.hasPromotion);
    setIncludeDistributionCenters(activeUploadSession.hasDistribution);
    setHasAppliedSmartDefaults(true);
  }, [step, activeUploadSession, hasAppliedSmartDefaults]);

  const handleGenerateForecast = async () => {
    // ── expiry guard ──────────────────────────────────────────────────────────
    if (!activeUploadSession) {
      setForecastError('No upload found for this Sales Group. Please upload data first.');
      return;
    }
    if (new Date() > activeUploadSession.expiresAt) {
      setForecastError('Your upload has expired. Please upload your file again.');
      onClearUploadSession(selectedGroup?.id ?? '');
      setStep('select');
      return;
    }

    setIsGenerating(true);
    setForecastError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_id: activeUploadSession.uploadId,
          sales_group_id: selectedGroup?.id,
          horizon: horizonToMonths[selectedHorizon],
          promotion: includePromotion ? promotionPercent : 0,
        }),
      });

      if (response.status === 404) {
        setForecastError('Upload expired. Please upload your file again.');
        onClearUploadSession(selectedGroup?.id ?? '');
        setStep('select');
        return;
      }
      if (response.status === 422) {
        const body = await response.json().catch(() => ({}));
        setForecastError(body?.detail ?? 'Invalid request. Please check your configuration.');
        return;
      }
      if (!response.ok) {
        setForecastError('Forecast failed. Please try again.');
        return;
      }

      const data = (await response.json()) as ForecastApiResponse;
      setForecastRows(mapApiToChartRows(data.forecast));
      setAppliedPromotion(data.promotion);
      setStep('results');
      setIsResultsLoading(true);
      if (compareMode && compareSelection.length === 2) {
        onForecastSuccess(compareSelection);
      } else if (selectedGroup) {
        onForecastSuccess([selectedGroup.id]);
      }
      console.log('Forecast API response:', data);
    } catch {
      setForecastError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (step !== 'results') return;
    const timer = setTimeout(() => setIsResultsLoading(false), 700);
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

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h1>Forecast</h1>
          <p className="text-muted-foreground mt-1">Select a Sales Group to generate forecast</p>
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
          <Button
            variant={compareMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCompareMode((prev) => !prev);
              setCompareSelection([]);
            }}
          >
            {compareMode ? 'Compare: On' : 'Compare: Off'}
          </Button>
          {compareMode && (
            <Badge variant="secondary">{compareSelection.length}/2 selected</Badge>
          )}
          {compareMode && !isLoading && (
            <Button
              size="sm"
              onClick={handleStartCompare}
              disabled={compareSelection.length !== 2}
            >
              Compare Selected Groups
            </Button>
          )}
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
              <Button onClick={() => onNavigate('upload')}>Upload Data</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className={`cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative group ${
                  compareMode && compareSelection.includes(group.id) ? 'ring-2 ring-primary border-primary' : ''
                }`}
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

  if (step === 'configure') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setStep('select')} className="gap-2">
            ← Back to Sales Groups
          </Button>
        </div>

        <div>
          <h1>{compareMode ? 'Configure Comparison Forecast' : 'Configure Forecast'}</h1>
          <p className="text-muted-foreground mt-1">
            {compareMode
              ? `${selectedCompareGroups[0]?.name ?? ''} vs ${selectedCompareGroups[1]?.name ?? ''}`
              : selectedGroup?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Horizon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '1-month', label: '1 Month' },
                    { value: '3-months', label: '3 Months' },
                    { value: '6-months', label: '6 Months' },
                    { value: '1-year', label: '12 Months' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedHorizon(option.value as any)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedHorizon === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Calendar Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Adjust for holidays, weekends, and seasonal patterns
                    </p>
                  </div>
                  <Switch checked={includeCalendar} onCheckedChange={setIncludeCalendar} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Price Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Factor in pricing changes and elasticity
                    </p>
                  </div>
                  <Switch checked={includePrice} onCheckedChange={setIncludePrice} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promotion Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Promotion Uplift</Label>
                    <p className="text-sm text-muted-foreground">
                      Estimate the uplift for the upcoming promotion during the forecast horizon
                    </p>
                  </div>
                  <Switch checked={includePromotion} onCheckedChange={setIncludePromotion} />
                </div>
                {!activeUploadSession?.hasPromotion && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                    No promotion history detected in your file. Promotion input will have limited effect.
                  </p>
                )}
                <div className={`space-y-3 ${includePromotion ? '' : 'opacity-50'}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Planned promotion intensity</span>
                    <Badge variant="secondary">{promotionPercent}%</Badge>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[promotionPercent]}
                    onValueChange={(value) => setPromotionPercent(value[0] ?? 0)}
                    disabled={!includePromotion}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a best-guess percentage to simulate promotional impact.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Distribution Coverage</Label>
                    <p className="text-sm text-muted-foreground">
                      Use distribution center availability to adjust forecast reach.
                    </p>
                  </div>
                  <Switch
                    checked={includeDistributionCenters}
                    onCheckedChange={setIncludeDistributionCenters}
                  />
                </div>
                <div className={`space-y-2 ${includeDistributionCenters ? '' : 'opacity-50'}`}>
                  <Label htmlFor="distributionCenters">Distribution Centers</Label>
                  <p className="text-sm text-muted-foreground">
                    Indicate how many distribution centers carry this sales group during the forecast horizon.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      id="distributionCenters"
                      type="number"
                      min={0}
                      max={500}
                      value={distributionCenters}
                      onChange={(event) => setDistributionCenters(Number(event.target.value))}
                      className="max-w-[160px]"
                      disabled={!includeDistributionCenters}
                    />
                    <Badge variant="secondary">{distributionCenters} centers</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This helps adjust forecast demand for distribution reach changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="mb-2">ProCast's Engine</h4>
                  <p className="text-sm text-muted-foreground">
                    Combines statistical baseline with Machine Learning residual correction for optimal accuracy.
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Historical Data</span>
                    <span>24 months minimum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Accuracy</span>
                    <span className="text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Trained</span>
                    <span>2 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload session status */}
            {activeUploadSession ? (
              <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-sm space-y-1">
                <p className="font-medium text-green-800">✓ File ready</p>
                <p className="text-green-700 text-xs">
                  {activeUploadSession.rowCount.toLocaleString()} rows •{' '}
                  {activeUploadSession.dateRange.length === 2
                    ? `${activeUploadSession.dateRange[0]} – ${activeUploadSession.dateRange[1]}`
                    : 'Date range unknown'}
                </p>
                <p className="text-xs text-amber-700 mt-1">Expires in: {countdown}</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm">
                <p className="font-medium text-amber-800">No file uploaded</p>
                <p className="text-amber-700 text-xs mt-1">
                  Go to Sales Groups and upload a file first.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => onNavigate('upload')}
                >
                  Go to Upload
                </Button>
              </div>
            )}

            {/* Error display */}
            {forecastError && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{forecastError}</span>
              </div>
            )}

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleGenerateForecast}
              disabled={
                isGenerating ||
                !activeUploadSession ||
                (activeUploadSession && new Date() > activeUploadSession.expiresAt) ||
                (compareMode && compareSelection.length !== 2)
              }
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  {compareMode ? 'Generate Comparison' : 'Generate Forecast'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setStep('configure')} className="gap-2">
          ← Back to Configuration
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1>{compareMode ? 'Comparison Results' : 'Forecast Results'}</h1>
          <p className="text-muted-foreground mt-1">
            {compareMode
              ? `${selectedCompareGroups[0]?.name ?? ''} vs ${selectedCompareGroups[1]?.name ?? ''} • ${selectedHorizon}`
              : `${selectedGroup?.name} • ${horizonToMonths[selectedHorizon]}-month forecast${appliedPromotion > 0 ? ` | Promotion: ${appliedPromotion}%` : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2"
            onClick={() =>
              exportToExcel(
                displayedRows,
                selectedGroup?.name ?? 'group',
                selectedHorizon,
                appliedPromotion,
                unitsLabel
              )
            }
            disabled={displayedRows.length === 0}
          >
            <Download size={16} />
            Export to Excel
          </Button>
        </div>
      </div>

      {isResultsLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-3 w-3/4" />
              </Card>
            ))}
          </div>
          <Card className="p-4 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-[360px] w-full rounded-lg" />
          </Card>
          <Card className="p-4 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-[220px] w-full rounded-lg" />
          </Card>
        </div>
      ) : compareMode ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{selectedCompareGroups[0]?.name ?? 'Group A'} Forecast Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-primary">
                  {compareForecastData.reduce((sum, row) => sum + row.groupA, 0).toLocaleString()} {unitsLabel}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{selectedCompareGroups[1]?.name ?? 'Group B'} Forecast Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-primary">
                  {compareForecastData.reduce((sum, row) => sum + row.groupB, 0).toLocaleString()} {unitsLabel}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Comparison Chart</CardTitle>
              <p className="text-sm text-muted-foreground">Monthly corrected forecast comparison</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={compareSeriesVisible.groupA ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareSeriesVisible((prev) => ({ ...prev, groupA: !prev.groupA }))}
                >
                  {selectedCompareGroups[0]?.name ?? 'Group A'}
                </Button>
                <Button
                  variant={compareSeriesVisible.groupB ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareSeriesVisible((prev) => ({ ...prev, groupB: !prev.groupB }))}
                >
                  {selectedCompareGroups[1]?.name ?? 'Group B'}
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={compareForecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip
                    cursor={{ stroke: '#1a3a52', strokeDasharray: '4 4' }}
                    formatter={(value: number) => `${value.toLocaleString()} ${unitsLabel}`}
                  />
                  <Legend />
                  {compareSeriesVisible.groupA && (
                    <Line type="monotone" dataKey="groupA" stroke="#1a3a52" strokeWidth={3} dot={{ r: 4 }} name={selectedCompareGroups[0]?.name ?? 'Group A'} />
                  )}
                  {compareSeriesVisible.groupB && (
                    <Line type="monotone" dataKey="groupB" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name={selectedCompareGroups[1]?.name ?? 'Group B'} />
                  )}
                  <Brush dataKey="month" height={20} stroke="#1a3a52" travellerWidth={10} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparison Table</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="w-full table-auto border border-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="border px-3 py-2 text-left">Month</th>
                    <th className="border px-3 py-2 text-right">{selectedCompareGroups[0]?.name ?? 'Group A'}</th>
                    <th className="border px-3 py-2 text-right">{selectedCompareGroups[1]?.name ?? 'Group B'}</th>
                    <th className="border px-3 py-2 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {compareForecastData.map((row) => (
                    <tr key={row.month} className="hover:bg-muted/30">
                      <td className="border px-3 py-2">{row.month}</td>
                      <td className="border px-3 py-2 text-right">{row.groupA.toLocaleString()} {unitsLabel}</td>
                      <td className="border px-3 py-2 text-right">{row.groupB.toLocaleString()} {unitsLabel}</td>
                      <td className="border px-3 py-2 text-right">{(row.groupA - row.groupB).toLocaleString()} {unitsLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ) : (
      <>
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Total Forecasted</span>
                  </TooltipTrigger>
                  <TooltipContent>Sum of all forecasted monthly values shown below.</TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-primary">
                {Math.round(displayedRows.reduce((s, r) => s + r.final, 0)).toLocaleString()} {unitsLabel}
              </div>
              <p className="secondary-meta text-xs text-muted-foreground mt-1">
                across {displayedRows.length} months
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Avg Confidence Range</span>
                  </TooltipTrigger>
                  <TooltipContent>Average ±% uncertainty around the forecast across months.</TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">
                {displayedRows.length > 0
                  ? `±${Math.round(
                      displayedRows.reduce((s, r) => s + ((r.upper - r.lower) / r.final) * 50, 0) /
                        displayedRows.length
                    )}%`
                  : '—'}
              </div>
              <p className="secondary-meta text-xs text-muted-foreground mt-1">95% confidence interval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">Peak Month</span>
                  </TooltipTrigger>
                  <TooltipContent>Month with the highest forecasted value.</TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">
                {displayedRows.length > 0
                  ? displayedRows.reduce((peak, r) => (r.final > peak.final ? r : peak), displayedRows[0]).month
                  : '—'}
              </div>
              <p className="secondary-meta text-xs text-muted-foreground mt-1">
                {displayedRows.length > 0
                  ? `${displayedRows
                      .reduce((peak, r) => (r.final > peak.final ? r : peak), displayedRows[0])
                      .final.toLocaleString()} ${unitsLabel} expected`
                  : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart + Scenario */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Visualization</CardTitle>
              <p className="text-sm text-muted-foreground">
                Historical sales with SARIMAX baseline and ML-adjusted final forecast
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={mainSeriesVisible.final ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMainSeriesVisible((prev) => ({ ...prev, final: !prev.final }))}
                >
                  Forecast
                </Button>
                <Button
                  variant={mainSeriesVisible.band ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMainSeriesVisible((prev) => ({ ...prev, band: !prev.band }))}
                >
                  Confidence Band
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={displayedRows} syncId="forecast-main-sync">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                    <RechartsTooltip
                    cursor={{ stroke: '#1a3a52', strokeDasharray: '4 4' }}
                    formatter={(value: number) => `${value.toLocaleString()} ${unitsLabel}`}
                  />
                  <Legend />
                  {mainSeriesVisible.band && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="upper"
                        fill="#e8dcc8"
                        stroke="none"
                        fillOpacity={0.3}
                        name="Upper Bound"
                      />
                      <Area
                        type="monotone"
                        dataKey="lower"
                        fill="#ffffff"
                        stroke="none"
                        fillOpacity={1}
                      />
                    </>
                  )}
                  {mainSeriesVisible.final && (
                    <Line
                      type="monotone"
                      dataKey="final"
                      stroke="#1a3a52"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      name="Forecast (ML Adjusted)"
                    />
                  )}
                  <Brush dataKey="month" height={20} stroke="#1a3a52" travellerWidth={10} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scenario Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Panel</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adjust assumptions to see a live what-if on the chart and table.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-promo">Promotion Uplift (%)</Label>
                  <Input
                    id="scenario-promo"
                    type="number"
                    value={scenarioPromotion}
                    onChange={(event) => setScenarioPromotion(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Positive increases demand.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-price">Price Change (%)</Label>
                  <Input
                    id="scenario-price"
                    type="number"
                    value={scenarioPrice}
                    onChange={(event) => setScenarioPrice(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Positive reduces demand.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-dist">Distribution Change (%)</Label>
                  <Input
                    id="scenario-dist"
                    type="number"
                    value={scenarioDistribution}
                    onChange={(event) => setScenarioDistribution(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Positive increases demand.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Multiplier: <span className="font-semibold text-foreground">x{scenarioMultiplier.toFixed(2)}</span>
                  {forecastRows.length > 0 && (
                    <span className="ml-2">
                      (
                      {Math.round(
                        ((displayedRows.reduce((s, r) => s + r.final, 0) -
                          forecastRows.reduce((s, r) => s + r.final, 0)) /
                          (forecastRows.reduce((s, r) => s + r.final, 0) || 1)) *
                          100
                      )}
                      % vs baseline)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={scenarioEnabled ? 'default' : 'outline'}
                    onClick={() => setScenarioEnabled(true)}
                  >
                    Apply Scenario
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScenarioEnabled(false);
                      setScenarioPromotion(0);
                      setScenarioPrice(0);
                      setScenarioDistribution(0);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forecast Output Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Forecast Output Table</CardTitle>
            <p className="text-sm text-muted-foreground">
              {horizonToMonths[selectedHorizon]}-month forecast ({unitsLabel})
              {appliedPromotion > 0 ? ` | Promotion: ${appliedPromotion}%` : ''}
            </p>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full table-auto border border-border">
              <thead className="bg-gray-100 dark:bg-slate-900">
                <tr>
                  <th className="border px-3 py-1 text-left">Month</th>
                  <th className="border px-3 py-1 text-center bg-blue-50 font-bold dark:bg-transparent">
                    Baseline ({unitsLabel})
                  </th>
                  <th className="border px-3 py-1 text-center bg-blue-50 font-bold dark:bg-transparent">
                    Correction ({unitsLabel})
                  </th>
                  <th className="border px-3 py-1 text-center bg-green-50 dark:bg-transparent">
                    Final ({unitsLabel})
                  </th>
                  <th className="border px-3 py-1 text-right">Upper Bound ({unitsLabel})</th>
                  <th className="border px-3 py-1 text-right">Lower Bound ({unitsLabel})</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((d, idx) => {
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-slate-900/60"
                    >
                      <td className="border px-3 py-1">
                        <div className="flex items-center gap-2">
                          <span>{d.month}</span>
                          {top3RankByIndex.has(idx) && (
                            (() => {
                              const rank = top3RankByIndex.get(idx) ?? 3;
                              const { label, className, Icon } = getRankBadge(rank);
                              return (
                                <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${className}`}>
                                  <Icon className="h-3 w-3" />
                                  <span className="uppercase tracking-wide">{label}</span>
                                </Badge>
                              );
                            })()
                          )}
                        </div>
                      </td>
                        <td className="border px-3 py-1 text-center bg-blue-50 font-semibold dark:bg-transparent">
                          {Math.round(d.baseline).toLocaleString()}
                        </td>
                    <td
                      className={`border px-3 py-1 text-center bg-blue-50 font-semibold dark:bg-transparent ${
                        d.correction < 0 ? 'text-red-600' : 'text-blue-900'
                      }`}
                    >
                          {Math.round(d.correction).toLocaleString()}
                        </td>
                    <td className="border px-3 py-1 text-center bg-green-50 font-bold dark:bg-transparent">
                      {Math.round(d.final).toLocaleString()}
                    </td>
                        <td className="border px-3 py-1 text-right">{Math.round(d.upper).toLocaleString()}</td>
                        <td className="border px-3 py-1 text-right">{Math.round(d.lower).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              if (displayedRows.length === 0) return null;
              const total = Math.round(displayedRows.reduce((s, r) => s + r.final, 0));
              const peak = displayedRows.reduce((p, r) => (r.final > p.final ? r : p), displayedRows[0]);
              const avgBand = Math.round(
                displayedRows.reduce((s, r) => s + ((r.upper - r.lower) / r.final) * 50, 0) /
                  displayedRows.length
              );
              const firstVal = displayedRows[0].final;
              const lastVal = displayedRows[displayedRows.length - 1].final;
              const trendPct = Math.round(((lastVal - firstVal) / firstVal) * 100);
              return (
                <>
                  <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      <strong>{trendPct >= 0 ? 'Upward' : 'Downward'} trend detected:</strong>{' '}
                      Forecast moves {trendPct >= 0 ? 'up' : 'down'} {Math.abs(trendPct)}% from first to
                      last month, with a total of {total.toLocaleString()} {unitsLabel} over the horizon.
                    </p>
                  </div>
                  <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Calendar className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      <strong>Peak month:</strong> {peak.month} is the highest forecasted month at{' '}
                      {Math.round(peak.final).toLocaleString()} {unitsLabel}.
                    </p>
                  </div>
                  <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <ChevronRight className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      <strong>Confidence interval:</strong> Average band width is ±{avgBand}% around
                      predicted values.
                      {appliedPromotion > 0 && ` Promotion uplift of ${appliedPromotion}% was applied.`}
                    </p>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Run Another Forecast */}
        <div className="flex justify-end gap-3 pb-4">
          <Button
            variant="outline"
            onClick={() => {
              setForecastRows([]);
              setForecastError(null);
              setStep('configure');
            }}
          >
            ← Change Configuration
          </Button>
          <Button
            onClick={() => {
              setForecastRows([]);
              setForecastError(null);
              setSelectedGroup(null);
              setStep('select');
            }}
          >
            Run Another Forecast
          </Button>
        </div>
      </>
      )}
    </div>
  );
}
