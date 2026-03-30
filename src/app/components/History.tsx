import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Calendar, Search, Star, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CategorySlicer } from './CategorySlicer';
import * as XLSX from 'xlsx';

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
  isPinned?: boolean;
}

interface HistoryProps {
  salesGroups: SalesGroup[];
  onTogglePin: (groupId: string) => void;
  isLoading: boolean;
  onNavigate: (section: string) => void;
  currency: 'EGP' | 'USD' | 'EUR';
  units: 'units' | 'cartons';
}

interface ForecastPoint {
  date: string;
  value: number;
}

interface ForecastRun {
  id: string;
  groupId: string;
  runDate: string;
  horizon: string;
  modelVersion: string;
  accuracy: number;
  growth: number;
  mape: number;
  wape: number;
  bias: number;
  forecastedSales: ForecastPoint[];
}

interface FlattenedForecastPoint {
  date: string;
  value: number;
  year: string;
  runDate: string;
}

const monthLabelFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

const addMonths = (isoDate: string, monthsToAdd: number): string => {
  const [yearStr, monthStr] = isoDate.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1 + monthsToAdd, 1));
  return date.toISOString().slice(0, 10);
};

const toMonthLabel = (isoDate: string): string => {
  const [yearStr, monthStr] = isoDate.split('-');
  return monthLabelFormatter.format(new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1)));
};

const makeSeries = (startDate: string, base: number, slope: number, wave: number): ForecastPoint[] => {
  return Array.from({ length: 12 }, (_, idx) => {
    const value = Math.max(1000, Math.round(base + idx * slope + Math.sin(idx / 1.6) * wave));
    return {
      date: addMonths(startDate, idx),
      value,
    };
  });
};

const buildRunsForGroup = (group: SalesGroup, groupIndex: number): ForecastRun[] => {
  const seed = group.name.length * 430 + (groupIndex + 1) * 970;
  const latestBase = 14000 + (seed % 6000);

  const runStartDates = ['2024-01-01', '2025-01-01', '2026-01-01'];

  return [
    {
      id: `${group.id}-r1`,
      groupId: group.id,
      runDate: '2026-03-04',
      horizon: '1 Year',
      modelVersion: 'SARIMAX + ML v2.3',
      accuracy: 94.2 - (groupIndex % 3) * 0.8,
      growth: 10.4 + (groupIndex % 4) * 1.3,
      mape: 5.8 + (groupIndex % 3) * 0.6,
      wape: 7.2 + (groupIndex % 2) * 0.5,
      bias: -0.7 + (groupIndex % 3) * 0.4,
      forecastedSales: makeSeries(runStartDates[2], latestBase, 620, 1200),
    },
    {
      id: `${group.id}-r2`,
      groupId: group.id,
      runDate: '2025-03-12',
      horizon: '1 Year',
      modelVersion: 'SARIMAX + ML v2.2',
      accuracy: 93.6 - (groupIndex % 3) * 0.7,
      growth: 9.1 + (groupIndex % 4) * 1.1,
      mape: 6.2 + (groupIndex % 3) * 0.5,
      wape: 7.9 + (groupIndex % 2) * 0.4,
      bias: -0.3 + (groupIndex % 2) * 0.5,
      forecastedSales: makeSeries(runStartDates[1], latestBase - 450, 560, 1050),
    },
    {
      id: `${group.id}-r3`,
      groupId: group.id,
      runDate: '2024-03-20',
      horizon: '1 Year',
      modelVersion: 'SARIMAX + ML v2.1',
      accuracy: 92.8 - (groupIndex % 3) * 0.6,
      growth: 8.4 + (groupIndex % 4) * 0.9,
      mape: 6.9 + (groupIndex % 3) * 0.4,
      wape: 8.5 + (groupIndex % 2) * 0.3,
      bias: 0.2 + (groupIndex % 2) * 0.4,
      forecastedSales: makeSeries(runStartDates[0], latestBase - 900, 510, 980),
    },
  ];
};

export function History({ salesGroups, onTogglePin, isLoading, onNavigate, units }: HistoryProps) {
  const [step, setStep] = useState<'select' | 'history'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const unitsLabel = units === 'cartons' ? 'cartons' : 'units';

  const runsByGroup = useMemo(() => {
    const map: Record<string, ForecastRun[]> = {};
    salesGroups.forEach((group, idx) => {
      map[group.id] = buildRunsForGroup(group, idx);
    });
    return map;
  }, [salesGroups]);

  const filteredGroups = salesGroups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || group.tags.some((tag) => selectedCategories.includes(tag));
    const matchesPinned = !pinnedOnly || Boolean(group.isPinned);
    return matchesSearch && matchesCategory && matchesPinned;
  });

  const availableCategories = useMemo(
    () => Array.from(new Set(salesGroups.flatMap((group) => group.tags))).sort(),
    [salesGroups]
  );

  const selectedGroupRuns = selectedGroup ? runsByGroup[selectedGroup.id] ?? [] : [];

  const allForecastedMonths = useMemo<FlattenedForecastPoint[]>(() => {
    const rows = selectedGroupRuns.flatMap((run) =>
      run.forecastedSales.map((point) => ({
        date: point.date,
        value: point.value,
        year: point.date.slice(0, 4),
        runDate: run.runDate,
      }))
    );

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedGroupRuns]);

  const monthlyHistoryByYear = useMemo(() => {
    return allForecastedMonths.reduce<Record<string, FlattenedForecastPoint[]>>((acc, row) => {
      if (!acc[row.year]) {
        acc[row.year] = [];
      }
      acc[row.year].push(row);
      return acc;
    }, {});
  }, [allForecastedMonths]);

  const yearlyKeys = useMemo(() => Object.keys(monthlyHistoryByYear).sort(), [monthlyHistoryByYear]);

  const chartRows = useMemo(
    () => allForecastedMonths.map((row) => ({ date: toMonthLabel(row.date), value: row.value })),
    [allForecastedMonths]
  );

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setStep('history');
    setIsHistoryLoading(true);
  };

  useEffect(() => {
    if (step !== 'history') return;
    const timer = setTimeout(() => setIsHistoryLoading(false), 700);
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

  const downloadGroupHistoryExcel = () => {
    if (!selectedGroup || allForecastedMonths.length === 0) return;

    const workbook = XLSX.utils.book_new();
    const valuesSheet = XLSX.utils.json_to_sheet(
      allForecastedMonths.map((row) => ({
        date: row.date,
        [`value (${unitsLabel})`]: row.value,
      }))
    );

    valuesSheet['!cols'] = [{ wch: 14 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(workbook, valuesSheet, 'Forecast History');

    const filename = `${selectedGroup.name.replace(/[^a-zA-Z0-9]/g, '_')}_forecast_history.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h1>History</h1>
          <p className="text-muted-foreground mt-1">View past forecast runs and historical performance</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search sales groups by name or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

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
              <Button onClick={() => onNavigate('forecast')}>Generate Forecast</Button>
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
                  <Badge className={`${getStatusColor(group.status)} text-xs`}>{group.status.replace('-', ' ')}</Badge>
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

        <Button className="gap-2" onClick={downloadGroupHistoryExcel} disabled={!allForecastedMonths.length}>
          <Download size={16} />
          Download Historical Forecasted Sales
        </Button>
      </div>

      <div>
        <h1>Forecast Run History</h1>
        <p className="text-muted-foreground mt-1">{selectedGroup?.name}</p>
      </div>

      {isHistoryLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
              </Card>
            ))}
          </div>
          <Card className="p-4 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-[220px] w-full rounded-lg" />
          </Card>
          <Card className="p-4 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-[260px] w-full rounded-lg" />
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{selectedGroupRuns.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Forecast Months</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-blue-600">{allForecastedMonths.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-green-600">
                  {selectedGroupRuns.length
                    ? `${(selectedGroupRuns.reduce((sum, run) => sum + run.accuracy, 0) / selectedGroupRuns.length).toFixed(1)}%`
                    : '-'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg MAPE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-blue-600">
                  {selectedGroupRuns.length
                    ? `${(selectedGroupRuns.reduce((sum, run) => sum + run.mape, 0) / selectedGroupRuns.length).toFixed(1)}%`
                    : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Runs Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run Date</TableHead>
                    <TableHead>Horizon</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>MAPE</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroupRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{run.runDate}</TableCell>
                      <TableCell>{run.horizon}</TableCell>
                      <TableCell>{run.modelVersion}</TableCell>
                      <TableCell>
                        <span className="text-green-600">{run.accuracy.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>{run.mape.toFixed(1)}%</TableCell>
                      <TableCell>
                        <span className="text-blue-600">+{run.growth.toFixed(1)}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Historical Forecasted Sales</CardTitle>
              <p className="text-sm text-muted-foreground">
                Combined monthly values from every forecast run for this sales group.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} ${unitsLabel}`} />
                  <Line type="monotone" dataKey="value" stroke="#1a3a52" strokeWidth={3} dot={{ r: 3 }} name={`Forecasted Value (${unitsLabel})`} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {yearlyKeys.map((year) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle>{year}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                <table className="w-full table-auto border border-border">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="border px-3 py-2 text-left">Date</th>
                      <th className="border px-3 py-2 text-right">Value ({unitsLabel})</th>
                      <th className="border px-3 py-2 text-left">Run Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyHistoryByYear[year].map((row) => (
                      <tr key={`${row.runDate}-${row.date}`} className="hover:bg-muted/30">
                        <td className="border px-3 py-2">{row.date}</td>
                        <td className="border px-3 py-2 text-right font-medium">
                          {row.value.toLocaleString()} {unitsLabel}
                        </td>
                        <td className="border px-3 py-2">{row.runDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
