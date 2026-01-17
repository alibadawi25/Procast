import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Search, Calendar, Tag, Upload as UploadIcon, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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

const previewData = [
  { date: '2024-01-01', sales: 15420, price: 29.99 },
  { date: '2024-01-02', sales: 16230, price: 29.99 },
  { date: '2024-01-03', sales: 14890, price: 29.99 },
  { date: '2024-01-04', sales: 17650, price: 31.99 },
  { date: '2024-01-05', sales: 18320, price: 31.99 },
];

export function UploadData() {
  const [step, setStep] = useState<'select' | 'upload'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupTags, setGroupTags] = useState('');

  const filteredGroups = mockSalesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategories.length === 0 || 
      group.tags.some(tag => selectedCategories.includes(tag));
    return matchesSearch && matchesCategory;
  });

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDescription('');
    setGroupTags(group.tags.join(', '));
    setUploadComplete(false);
    setStep('upload');
  };

  const handleCreateNew = () => {
    setSelectedGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupTags('');
    setUploadComplete(false);
    setStep('upload');
  };

  const handleFileUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadComplete(true);
    }, 2000);
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
        <div className="flex items-center justify-between">
          <div>
            <h1>Upload Data</h1>
            <p className="text-muted-foreground mt-1">Select or create a Sales Group to upload data</p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus size={16} />
            Create New Sales Group
          </Button>
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

        {/* Category Filter */}
        <CategorySlicer
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
        <h1>{selectedGroup ? 'Update' : 'Create'} Sales Group</h1>
        <p className="text-muted-foreground mt-1">
          {selectedGroup ? 'Upload new data to existing sales group' : 'Configure and upload data for new sales group'}
        </p>
      </div>

      {/* Sales Group Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Group Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Electronics × North America"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description of this sales group..."
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g., Category, Region, Channel (comma-separated)"
              value={groupTags}
              onChange={(e) => setGroupTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add tags like Category, Region or Channel for easier filtering
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={handleFileUpload}
          >
            <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="mb-2">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-muted-foreground">Excel (.xlsx, .xls) or CSV files</p>
            <p className="text-xs text-muted-foreground mt-4">
              Expected columns: Date, Sales Volume, Price(optional)
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm text-blue-900">Validating and processing data...</span>
            </div>
          )}

          {uploadComplete && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm text-green-900">Data validation successful!</p>
                  <p className="text-xs text-green-700 mt-1">
                    2,456 rows processed • Date range: Jan 2023 - Dec 2024
                  </p>
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <h4 className="mb-3">Data Preview</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Sales Volume</TableHead>
                        <TableHead>Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.sales.toLocaleString()}</TableCell>
                          <TableCell>${row.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Showing first 5 rows of 2,456</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setUploadComplete(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep('select')} className="gap-2">
                  Confirm Upload
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}