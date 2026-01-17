import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Search, ChevronRight, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { CategorySlicer } from './CategorySlicer';

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
}

interface ForecastHistory {
  id: string;
  date: string;
  horizon: string;
  modelVersion: string;
  accuracy: string;
  growth: string;
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

const mockHistory: ForecastHistory[] = [
  {
    id: '1',
    date: 'Dec 26, 2024',
    horizon: '3 Months',
    modelVersion: 'SARIMAX + ML v2.1',
    accuracy: '94.2%',
    growth: '+12.8%',
  },
  {
    id: '2',
    date: 'Dec 15, 2024',
    horizon: '1 Year',
    modelVersion: 'SARIMAX + ML v2.1',
    accuracy: '93.8%',
    growth: '+14.2%',
  },
  {
    id: '3',
    date: 'Nov 28, 2024',
    horizon: '3 Months',
    modelVersion: 'SARIMAX + ML v2.0',
    accuracy: '91.5%',
    growth: '+11.3%',
  },
  {
    id: '4',
    date: 'Nov 10, 2024',
    horizon: 'AOP',
    modelVersion: 'SARIMAX + ML v2.0',
    accuracy: '92.1%',
    growth: '+13.5%',
  },
  {
    id: '5',
    date: 'Oct 22, 2024',
    horizon: '1 Month',
    modelVersion: 'SARIMAX + ML v1.9',
    accuracy: '95.3%',
    growth: '+8.7%',
  },
];

const historicalForecastData = [
  { month: 'Jul', sales: 17100, forecast: 17200 },
  { month: 'Aug', sales: 16800, forecast: 17000 },
  { month: 'Sep', sales: 18200, forecast: 18000 },
  { month: 'Oct', sales: 19500, forecast: 19300 },
  { month: 'Nov', sales: 21000, forecast: 20500 },
  { month: 'Dec', sales: 23400, forecast: 23100 },
];

export function History() {
  const [step, setStep] = useState<'select' | 'history'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<ForecastHistory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredGroups = mockSalesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      group.tags.some(tag => selectedCategories.includes(tag));
    return matchesSearch && matchesCategory;
  });

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setStep('history');
  };

  const handleViewForecast = (forecast: ForecastHistory) => {
    setSelectedForecast(forecast);
    setDialogOpen(true);
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
          <h1>History</h1>
          <p className="text-muted-foreground mt-1">View past forecasts and performance metrics</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search sales groups..."
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setStep('select')} className="gap-2">
          ← Back to Sales Groups
        </Button>
      </div>

      <div>
        <h1>Forecast History</h1>
        <p className="text-muted-foreground mt-1">{selectedGroup?.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{mockHistory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-green-600">93.4%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Best Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">95.3%</div>
            <p className="text-xs text-muted-foreground mt-1">Oct 22, 2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">+12.1%</div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast History</CardTitle>
          <p className="text-sm text-muted-foreground">Click on any row to view detailed results</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Generated</TableHead>
                <TableHead>Horizon</TableHead>
                <TableHead>Model Version</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Growth</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((forecast) => (
                <TableRow key={forecast.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{forecast.date}</TableCell>
                  <TableCell>{forecast.horizon}</TableCell>
                  <TableCell>{forecast.modelVersion}</TableCell>
                  <TableCell>
                    <span className="text-green-600">{forecast.accuracy}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-600">{forecast.growth}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewForecast(forecast)}
                      className="gap-2"
                    >
                      <Eye size={14} />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Accuracy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockHistory.reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis domain={[85, 100]} stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forecast Details - {selectedForecast?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Horizon</p>
                <p>{selectedForecast?.horizon}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model Version</p>
                <p>{selectedForecast?.modelVersion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-green-600">{selectedForecast?.accuracy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="text-blue-600">{selectedForecast?.growth}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-4">Historical Performance</h4>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={historicalForecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#1a3a52"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual Sales"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#e8dcc8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name="Forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}