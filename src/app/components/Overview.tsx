import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, TrendingUp, Package, Users, BarChart3, Activity, MessageSquare } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  onNavigate: (section: string) => void;
  currency: 'EGP' | 'USD' | 'EUR';
  units: 'units' | 'cartons';
}

const salesData = [
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

const productMixData = [
  { name: 'Product A', value: 4200, percentage: 35 },
  { name: 'Product B', value: 3200, percentage: 27 },
  { name: 'Product C', value: 2400, percentage: 20 },
  { name: 'Product D', value: 1400, percentage: 12 },
  { name: 'Others', value: 800, percentage: 6 },
];

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const recentActivity = [
  { type: 'upload', title: 'APM 1L', date: '2 hours ago', status: 'completed' },
  { type: 'forecast', title: 'AMJ MS 1L', date: '1 week ago', status: 'completed' },
  { type: 'upload', title: 'Al Marai Butter 500gm', date: '3 hours ago', status: 'completed' },
  { type: 'forecast', title: 'BJ MS 1L', date: '2 days ago', status: 'completed' },
];

export function Overview({ onNavigate, currency, units }: OverviewProps) {
  const unitsLabel = units === 'cartons' ? 'cartons' : 'units';
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncDarkMode = () => setIsDarkMode(root.classList.contains('dark'));
    syncDarkMode();

    const observer = new MutationObserver(syncDarkMode);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartGridStroke = isDarkMode ? 'rgba(186, 209, 233, 0.36)' : '#e5e7eb';
  const chartAxisStroke = isDarkMode ? '#c4d4e6' : '#6b7280';
  const chartLineStroke = isDarkMode ? 'var(--chart-1)' : '#1a3a52';
  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Overview</h1>
        <p className="text-muted-foreground mt-1">Executive summary and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Sales Groups</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">6</div>
            <p className="secondary-meta text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Forecasts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2</div>
            <p className="secondary-meta text-xs text-muted-foreground mt-1">Running this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Avg Forecast Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">88.2%</div>
            <p className="secondary-meta text-xs text-green-600 mt-1">+2.3% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Last Data Update</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2h</div>
            <p className="secondary-meta text-xs text-muted-foreground mt-1">ago by folan el folany</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Aggregate Sales Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last 12 months across all sales groups ({unitsLabel})</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis
                  dataKey="month"
                  stroke={chartAxisStroke}
                  axisLine={{ stroke: chartGridStroke }}
                  tickLine={{ stroke: chartGridStroke }}
                  tick={{ fill: chartAxisStroke, fontSize: 12 }}
                />
                <YAxis
                  stroke={chartAxisStroke}
                  axisLine={{ stroke: chartGridStroke }}
                  tickLine={{ stroke: chartGridStroke }}
                  tick={{ fill: chartAxisStroke, fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} ${unitsLabel}`}
                  contentStyle={
                    isDarkMode
                      ? {
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--foreground)',
                        }
                      : undefined
                  }
                  labelStyle={isDarkMode ? { color: 'var(--foreground)', fontWeight: 600 } : undefined}
                  itemStyle={isDarkMode ? { color: 'var(--foreground)' } : undefined}
                />
                <Legend wrapperStyle={isDarkMode ? { color: chartAxisStroke, paddingTop: 8 } : undefined} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke={chartLineStroke}
                  strokeWidth={2}
                  name="Actual Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Mix */}
        <Card>
          <CardHeader>
            <CardTitle>Product Mix Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">Revenue distribution by product</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productMixData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [formatCurrency.format(value), name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Smart Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className={`rounded-full p-2 ${activity.type === 'upload' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {activity.type === 'upload' ? (
                      <Upload className="h-4 w-4 text-blue-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                  </div>
                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Smart Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Smart Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">3 sales groups need data</p>
              <p className="text-xs text-amber-800 mt-1">Upload new data to unlock forecasting.</p>
              <Button
                className="mt-3 w-full justify-start gap-2"
                onClick={() => onNavigate('upload')}
              >
                <Upload size={16} />
                Upload Missing Data
              </Button>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-900">Forecast coverage is low</p>
              <p className="text-xs text-blue-800 mt-1">Run a fresh forecast for this month.</p>
              <Button
                className="mt-3 w-full justify-start gap-2"
                variant="outline"
                onClick={() => onNavigate('forecast')}
              >
                <TrendingUp size={16} />
                Run New Forecast
              </Button>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-900">Notes need review</p>
              <p className="text-xs text-emerald-800 mt-1">Check collaborator notes for blockers.</p>
              <Button
                className="mt-3 w-full justify-start gap-2"
                variant="outline"
                onClick={() => onNavigate('notes')}
              >
                <MessageSquare size={16} />
                Review Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
