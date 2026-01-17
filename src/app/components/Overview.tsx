import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, TrendingUp, Package, Users, BarChart3, Activity, MessageSquare } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewProps {
  onNavigate: (section: string) => void;
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

const recentActivity = [
  { type: 'upload', title: 'APM 1L', date: '2 hours ago', status: 'completed' },
  { type: 'forecast', title: 'AMJ MS 1L', date: '1 week ago', status: 'completed' },
  { type: 'upload', title: 'Al Marai Butter 500gm', date: '3 hours ago', status: 'completed' },
  { type: 'forecast', title: 'BJ MS 1L', date: '2 days ago', status: 'completed' },
];

export function Overview({ onNavigate }: OverviewProps) {
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
            <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Forecasts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2</div>
            <p className="text-xs text-muted-foreground mt-1">Running this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Avg Forecast Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">88.2%</div>
            <p className="text-xs text-green-600 mt-1">+2.3% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Last Data Update</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">2h</div>
            <p className="text-xs text-muted-foreground mt-1">ago by folan el folany</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Aggregate Sales Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last 12 months across all sales groups</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#1a3a52" strokeWidth={2} name="Actual Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Forecast vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast vs Actual</CardTitle>
            <p className="text-sm text-muted-foreground">Performance comparison - Last 12 months</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#1a3a52" name="Actual" />
                <Bar dataKey="forecast" fill="#e8dcc8" name="Forecast" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-2" 
              onClick={() => onNavigate('upload')}
            >
              <Upload size={16} />
              Upload New Data
            </Button>
            <Button 
              className="w-full justify-start gap-2" 
              variant="outline"
              onClick={() => onNavigate('forecast')}
            >
              <TrendingUp size={16} />
              Run New Forecast
            </Button>
            <Button 
              className="w-full justify-start gap-2" 
              variant="outline"
              onClick={() => onNavigate('proask')}
            >
              <MessageSquare size={16} />
              Ask ProAsk
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}