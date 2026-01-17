import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Search, TrendingUp, ChevronRight, Download, Save } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { CategorySlicer } from './CategorySlicer';

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
}

const mockSalesGroups: SalesGroup[] = [
  {
    id: '1',
    name: 'APM 1L',
    timeSpan: 'Jan 2023 - Dec 2024',
    lastUpload: '2 hours ago',
    status: 'forecasted',
    tags: ['Milk'],
  },
  {
    id: '2',
    name: 'APM 1.5L',
    timeSpan: 'Mar 2023 - Dec 2024',
    lastUpload: '1 day ago',
    status: 'ready',
    tags: ['Milk'],
  },
  {
    id: '3',
    name: 'BPM 1L',
    timeSpan: 'Jun 2023 - Nov 2024',
    lastUpload: '3 days ago',
    status: 'needs-data',
    tags: ['Milk'],
  },
  {
    id: '4',
    name: 'AMJ MS 1L',
    timeSpan: 'Jan 2023 - Dec 2024',
    lastUpload: '1 week ago',
    status: 'forecasted',
    tags: ['Juice'],
  },
  {
    id: '5',
    name: 'BJ MS 1L',
    timeSpan: 'Feb 2023 - Dec 2024',
    lastUpload: '5 days ago',
    status: 'ready',
    tags: ['Juice'],
  },
  {
    id: '6',
    name: 'Al Marai Butter 500gm',
    timeSpan: 'Jan 2023 - Dec 2024',
    lastUpload: '3 hours ago',
    status: 'needs-data',
    tags: ['Butter', 'importation'],
  },
];

const historicalData = [
  { month: 'Jan', sales: 12500 },
  { month: 'Feb', sales: 13200 },
  { month: 'Mar', sales: 14100 },
  { month: 'Apr', sales: 13800 },
  { month: 'May', sales: 15200 },
  { month: 'Jun', sales: 16400 },
  { month: 'Jul', sales: 17100 },
  { month: 'Aug', sales: 16800 },
  { month: 'Sep', sales: 18200 },
  { month: 'Oct', sales: 19500 },
  { month: 'Nov', sales: 21000 },
  { month: 'Dec', sales: 23400 },
];

const forecastData = [
  { month: 'Jan', baseline: 23200, corrected: 23800, upper: 25500, lower: 22100 },
  { month: 'Feb', baseline: 24100, corrected: 24600, upper: 26400, lower: 22800 },
  { month: 'Mar', baseline: 25300, corrected: 25900, upper: 27800, lower: 24000 },
  { month: 'Apr', baseline: 26200, corrected: 26700, upper: 28700, lower: 24700 },
  { month: 'May', baseline: 25800, corrected: 26300, upper: 28300, lower: 24300 },
  { month: 'Jun', baseline: 27100, corrected: 27600, upper: 29700, lower: 25500 },
  { month: 'Jul', baseline: 28400, corrected: 28900, upper: 31100, lower: 26700 },
  { month: 'Aug', baseline: 30200, corrected: 30800, upper: 33200, lower: 28400 },
  { month: 'Sep', baseline: 33100, corrected: 33700, upper: 36300, lower: 31100 },
  { month: 'Oct', baseline: 34000, corrected: 34700, upper: 37200, lower: 32200 },
  { month: 'Nov', baseline: 35800, corrected: 36500, upper: 39100, lower: 33900 },
  { month: 'Dec', baseline: 37500, corrected: 38300, upper: 41000, lower: 35700 },
];

export function Forecast() {
  const [step, setStep] = useState<'select' | 'configure' | 'results'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHorizon, setSelectedHorizon] = useState<'1-month' | '3-months' | '1-year' | 'aop'>('3-months');
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredGroups = mockSalesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      group.tags.some(tag => selectedCategories.includes(tag));
    return matchesSearch && matchesCategory;
  });

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setStep('configure');
  };

  const handleGenerateForecast = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep('results');
    }, 3000);
  };

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
          <input
            type="text"
            placeholder="Search sales groups by name or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input-background"
          />
        </div>

        {/* Category Slicer */}
        <CategorySlicer
          categories={mockSalesGroups.flatMap(group => group.tags).filter((value, index, self) => self.indexOf(value) === index)}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
        />

        {/* Sales Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectGroup(group)}
            >
              <CardHeader>
                <CardTitle className="text-base">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>{group.timeSpan}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last upload: {group.lastUpload}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Badge className={`${getStatusColor(group.status)} text-xs`}>
                  {group.status.replace('-', ' ')}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
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
          <h1>Configure Forecast</h1>
          <p className="text-muted-foreground mt-1">{selectedGroup?.name}</p>
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
                    { value: '1-year', label: '1 Year' },
                    { value: 'aop', label: 'AOP (Annual Operating Plan)' },
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

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleGenerateForecast}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Generate Forecast
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
          <h1>Forecast Results</h1>
          <p className="text-muted-foreground mt-1">{selectedGroup?.name} • {selectedHorizon}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Save size={16} />
            Save to History
          </Button>
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Expected Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-green-600">+12.8%</div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Forecast Uncertainty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">±8.2%</div>
            <p className="text-xs text-muted-foreground mt-1">95% confidence interval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Peak Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">December</div>
            <p className="text-xs text-muted-foreground mt-1">33,700 units expected</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Visualization</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historical sales with SARIMAX baseline and ML-adjusted final forecast
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="upper"
                fill="#e8dcc8"
                stroke="none"
                fillOpacity={0.3}
                name="Confidence Band"
              />
              <Area
                type="monotone"
                dataKey="lower"
                fill="#ffffff"
                stroke="none"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Historical Sales"
              />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="SARIMAX Baseline"
              />
              <Line
                type="monotone"
                dataKey="final"
                stroke="#1a3a52"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Final Forecast (ML Adjusted)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast Output Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Forecast Output Table</CardTitle>
          <p className="text-sm text-muted-foreground">Tabular Forecasts output</p>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full table-auto border border-border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-1 text-left">Month</th>
                <th className="border px-3 py-1 text-left">Baseline</th>
                <th className="border px-3 py-1 text-middle bg-blue-50 font-bold">Corrected</th>
                <th className="border px-3 py-1 text-right">Upper</th>
                <th className="border px-3 py-1 text-right">Lower</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-3 py-1">{d.month}</td>
                  <td className="border px-3 py-1 text-left">{d.baseline ?? '-'}</td>
                  <td className="border px-3 py-1 text-center bg-blue-50 font-semibold">{d.corrected ?? '-'}</td>
                  <td className="border px-3 py-1 text-right">{d.upper ?? '-'}</td>
                  <td className="border px-3 py-1 text-right">{d.lower ?? '-'}</td>
                </tr>
              ))}
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
          <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm">
                <strong>Strong upward trend detected:</strong> The forecast shows sustained growth throughout the period, with acceleration in Q4.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm">
                <strong>Seasonal peak expected:</strong> December shows the highest forecast at 33,700 units, consistent with historical holiday patterns.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <ChevronRight className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm">
                <strong>High confidence forecast:</strong> The model shows strong agreement between SARIMAX baseline and ML adjustment, indicating robust predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}