import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Search, TrendingUp, TrendingDown, DollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CategorySlicer } from './CategorySlicer';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

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

const salesTrendData = [
  { month: 'Jul', sales: 17100, target: 16500, growth: 3.6 },
  { month: 'Aug', sales: 16800, target: 17000, growth: -1.8 },
  { month: 'Sep', sales: 18200, target: 17500, growth: 8.3 },
  { month: 'Oct', sales: 19500, target: 18000, growth: 7.1 },
  { month: 'Nov', sales: 21000, target: 19500, growth: 7.7 },
  { month: 'Dec', sales: 23400, target: 21000, growth: 11.4 },
];

const productMixData = [
  { name: 'Product A', value: 4200, percentage: 35 },
  { name: 'Product B', value: 3200, percentage: 27 },
  { name: 'Product C', value: 2400, percentage: 20 },
  { name: 'Product D', value: 1400, percentage: 12 },
  { name: 'Others', value: 800, percentage: 6 },
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

const COLORS = ['#1a3a52', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function Dashboard() {
  const [step, setStep] = useState<'select' | 'analytics'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filteredGroups = mockSalesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      group.tags.some(tag => selectedCategories.includes(tag));
    return matchesSearch && matchesCategory;
  });

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setStep('analytics');
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
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-1">Select a Sales Group to view analytics</p>
        </div>

        {/* Category Slicer */}
        <CategorySlicer
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
        />

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

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sales groups found matching your filters</p>
          </div>
        )}
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
        <h1>Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">{selectedGroup?.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">$128.1K</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">+15.3% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2,860</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">+8.7% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Growth Rate</CardTitle>
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
            <CardTitle className="text-sm">Forecast Accuracy</CardTitle>
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#e8dcc8"
                  fill="#e8dcc8"
                  fillOpacity={0.3}
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#1a3a52"
                  fill="#1a3a52"
                  fillOpacity={0.5}
                  name="Actual Sales"
                />
              </AreaChart>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="channel" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#1a3a52" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Forecast Accuracy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Accuracy Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Weekly accuracy performance</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis domain={[85, 100]} stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#10b981' }}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
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
                      <td className="py-3 text-right">${channel.revenue.toLocaleString()}</td>
                      <td className="py-3 text-right">{channel.orders.toLocaleString()}</td>
                      <td className="py-3 text-right">${channel.avgOrder.toFixed(2)}</td>
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
    </div>
  );
}
