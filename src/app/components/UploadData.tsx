import { useState, useRef, useEffect, useMemo, useCallback, memo, type ChangeEvent, type DragEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Plus, Search, Calendar, Upload as UploadIcon, CheckCircle, AlertCircle, ChevronRight, Trash2, Download, GripVertical, Star } from 'lucide-react';
import { CategorySlicer } from './CategorySlicer';
import { Workbook } from 'exceljs';
import { downloadWorkbook } from '../lib/excel';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import type { UploadSession } from '../App';
import { API_BASE_URL, authFetch } from '../lib/auth';

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
  isPinned?: boolean;
}

interface UploadDataProps {
  salesGroups: SalesGroup[];
  onReorder: (newOrder: SalesGroup[]) => void;
  onTogglePin: (groupId: string) => void;
  isLoading: boolean;
  onUploadSuccess: (groupId: string, session: UploadSession) => void;
}

interface ValidateResponse {
  valid: boolean;
  message: string;
  row_count: number;
  date_range: [string, string] | [];
  corrections: string[];
  warnings: string[];
  has_price: boolean;
  date_column_mode: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  upload_id: string;
  filename: string;
  created_at: string;
  row_count: number;
  date_range: [string, string] | [];
  corrections: string[];
  warnings: string[];
  has_price: boolean;
  date_column_mode: string;
}

interface BackendSalesGroupResponse {
  id: string;
  company_id: string;
  name: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface DragItem {
  id: string;
  originalIndex: number;
  hasMoved?: boolean;
}

// Generate realistic mock data for each sales group
const generateMockData = (groupName: string): { date: string; sales: number; price: number }[] => {
  const data: { date: string; sales: number; price: number }[] = [];
  const baseSales = Math.floor(Math.random() * 10000) + 10000;
  const basePrice = Math.random() * 10 + 20;
  
  // Generate 2 years of daily data
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    // Add some variation to sales
    const variation = (Math.random() - 0.5) * 0.3;
    const dayOfWeek = d.getDay();
    // Weekend sales are usually lower
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1;
    const sales = Math.floor(baseSales * (1 + variation) * weekendFactor);
    const price = Number((basePrice + (Math.random() - 0.5) * 2).toFixed(2));
    
    data.push({ date: dateStr, sales, price });
  }
  
  return data;
};

// Export function to download Excel file
const exportToExcel = async (group: SalesGroup) => {
  const data = generateMockData(group.name);

  // Create workbook and worksheet
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Sales Data');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Sales', key: 'sales', width: 15 },
    { header: 'Price', key: 'price', width: 10 },
  ];

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Generate filename
  const filename = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_sales_data.xlsx`;

  // Download the file
  await downloadWorkbook(workbook, filename);
};

export function UploadData({ salesGroups: propSalesGroups, onReorder, onTogglePin, isLoading, onUploadSuccess }: UploadDataProps) {
  const [step, setStep] = useState<'select' | 'upload'>('select');
  const [selectedGroup, setSelectedGroup] = useState<SalesGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupTags, setGroupTags] = useState('');
  const [localSalesGroups, setLocalSalesGroups] = useState<SalesGroup[]>(propSalesGroups);
  const [groupToDelete, setGroupToDelete] = useState<SalesGroup | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [groupSaveError, setGroupSaveError] = useState<string | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestGroupsRef = useRef<SalesGroup[]>(propSalesGroups);
  const qualityScore = useMemo(() => {
    const source = validationResult ?? uploadResult;
    if (!source) return null;
    const warnings = source.warnings?.length ?? 0;
    const corrections = source.corrections?.length ?? 0;
    let score = 100 - warnings * 8 - corrections * 4;
    if ('valid' in source && source.valid === false) score -= 10;
    score = Math.max(40, Math.min(100, Math.round(score)));
    return score;
  }, [validationResult, uploadResult]);

  const qualityTone = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200 text-green-800';
    if (score >= 70) return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  // Sync with prop when it changes
  useEffect(() => {
    setLocalSalesGroups(propSalesGroups);
  }, [propSalesGroups]);

  useEffect(() => {
    latestGroupsRef.current = localSalesGroups;
  }, [localSalesGroups]);

  useEffect(() => {
    setSelectedGroupIds((prev) => {
      const next = new Set<string>();
      const validIds = new Set(localSalesGroups.map((group) => group.id));
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [localSalesGroups]);

  useEffect(() => {
    if (!selectionMode) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const isCard = target.closest('[data-sales-group-card]');
      if (isCard) return;
      setSelectionMode(false);
      clearSelection();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [selectionMode]);

  useEffect(() => {
    if (selectionMode && selectedGroupIds.size === 0) {
      setSelectionMode(false);
    }
  }, [selectionMode, selectedGroupIds]);

  const filteredGroups = localSalesGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategories.length === 0 || 
      group.tags.some(tag => selectedCategories.includes(tag));
    const matchesPinned = !pinnedOnly || Boolean(group.isPinned);
    return matchesSearch && matchesCategory && matchesPinned;
  });

  const availableCategories = useMemo(
    () => Array.from(new Set(localSalesGroups.flatMap((group) => group.tags))).sort(),
    [localSalesGroups]
  );

  const selectedGroups = useMemo(
    () => localSalesGroups.filter((group) => selectedGroupIds.has(group.id)),
    [localSalesGroups, selectedGroupIds]
  );

  const hasSelection = selectedGroupIds.size > 0;
  const hasUnpinnedSelected = selectedGroups.some((group) => !group.isPinned);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    localSalesGroups.forEach((group, index) => map.set(group.id, index));
    return map;
  }, [localSalesGroups]);

  const swapCards = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalSalesGroups((prevGroups) => {
      if (dragIndex === hoverIndex) return prevGroups;
      const nextGroups = [...prevGroups];
      [nextGroups[dragIndex], nextGroups[hoverIndex]] = [nextGroups[hoverIndex], nextGroups[dragIndex]];
      return nextGroups;
    });
  }, []);

  const commitReorder = useCallback(() => {
    onReorder(latestGroupsRef.current);
  }, [onReorder]);

  const handleSelectGroup = (group: SalesGroup) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDescription('');
    setGroupTags(group.tags.join(', '));
    setValidationResult(null);
    setUploadResult(null);
    setUploadError(null);
    setGroupSaveError(null);
    setSelectedFile(null);
    setStep('upload');
  };

  const handleCreateNew = () => {
    setSelectedGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupTags('');
    setValidationResult(null);
    setUploadResult(null);
    setUploadError(null);
    setGroupSaveError(null);
    setSelectedFile(null);
    setStep('upload');
  };

  const handleSaveGroup = async () => {
    const name = groupName.trim();
    if (!name) return;

    const tags = groupTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (selectedGroup) {
      setIsSavingGroup(true);
      setGroupSaveError(null);

      try {
        const response = await authFetch(
          `${API_BASE_URL}/sales-groups/?sales_group_id=${encodeURIComponent(selectedGroup.id)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              category: tags[0] ?? null,
              description: groupDescription.trim() || null,
            }),
          }
        );

        if (response.status === 401) {
          throw new Error('Your session expired. Please sign in again.');
        }

        if (!response.ok) {
          let message = 'Could not update sales group.';
          try {
            const payload = (await response.json()) as { detail?: string };
            if (payload?.detail) {
              message = payload.detail;
            }
          } catch {
            const fallback = await response.text();
            if (fallback) {
              message = fallback;
            }
          }
          throw new Error(message);
        }

        const payload = (await response.json()) as BackendSalesGroupResponse;
        const updatedGroups = localSalesGroups.map((group) =>
          group.id === selectedGroup.id
            ? {
                ...group,
                id: payload.id,
                name: payload.name,
                tags,
              }
            : group
        );
        setLocalSalesGroups(updatedGroups);
        onReorder(updatedGroups);
        setSelectedGroup((prev) =>
          prev
            ? {
                ...prev,
                id: payload.id,
                name: payload.name,
                tags,
              }
            : prev
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update sales group.';
        setGroupSaveError(message);
      } finally {
        setIsSavingGroup(false);
      }
      return;
    }

    setIsSavingGroup(true);
    setGroupSaveError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/sales-groups/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category: tags[0] ?? null,
          description: groupDescription.trim() || null,
          is_active: true,
        }),
      });

      if (response.status === 401) {
        throw new Error('Your session expired. Please sign in again.');
      }

      if (!response.ok) {
        let message = 'Could not create sales group.';
        try {
          const payload = (await response.json()) as { detail?: string };
          if (payload?.detail) {
            message = payload.detail;
          }
        } catch {
          const fallback = await response.text();
          if (fallback) {
            message = fallback;
          }
        }
        throw new Error(message);
      }

      const payload = (await response.json()) as BackendSalesGroupResponse;
      const newGroup: SalesGroup = {
        id: payload.id,
        name: payload.name,
        timeSpan: 'Not set',
        lastUpload: 'Not uploaded yet',
        status: 'needs-data',
        tags,
      };

      const nextGroups = [newGroup, ...localSalesGroups];
      setLocalSalesGroups(nextGroups);
      onReorder(nextGroups);
      setSelectedGroup(newGroup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create sales group.';
      setGroupSaveError(message);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleFileUpload = async (): Promise<boolean> => {
    if (!selectedFile) return false;
    if (!selectedGroup) {
      setUploadError('Please select a Sales Group before uploading.');
      return false;
    }
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sales_group_id', selectedGroup.id);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed.');
      }

      const payload = (await response.json()) as UploadResponse;
      setUploadResult({
        ...payload,
        corrections: payload.corrections ?? [],
        warnings: payload.warnings ?? [],
      });
      setValidationResult(null);

      // Bubble upload session up to App so Forecast can consume it
      onUploadSuccess(selectedGroup.id, {
        uploadId: payload.upload_id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        hasPromotion: (payload as any).has_promotion ?? false,
        hasPrice: payload.has_price,
        hasDistribution: (payload as any).has_distribution ?? false,
        rowCount: payload.row_count,
        dateRange: payload.date_range,
        corrections: payload.corrections,
        warnings: payload.warnings,
      });

      if (selectedGroup) {
        const updatedGroups: SalesGroup[] = localSalesGroups.map((group) =>
          group.id === selectedGroup.id
            ? {
                ...group,
                status: 'ready',
                lastUpload: 'Just now',
                timeSpan:
                  payload.date_range.length === 2
                    ? `${payload.date_range[0]} - ${payload.date_range[1]}`
                    : group.timeSpan,
              }
            : group
        );
        setLocalSalesGroups(updatedGroups);
        onReorder(updatedGroups);
        setSelectedGroup((prev) =>
          prev
            ? {
                ...prev,
                status: 'ready',
                lastUpload: 'Just now',
                timeSpan:
                  payload.date_range.length === 2
                    ? `${payload.date_range[0]} - ${payload.date_range[1]}`
                    : prev.timeSpan,
              }
            : prev
        );
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setUploadError(message);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const validateFile = async (file: File) => {
    setIsValidating(true);
    setValidationResult(null);
    setUploadResult(null);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Validation failed.');
      }

      const payload = (await response.json()) as ValidateResponse;
      setValidationResult({
        ...payload,
        corrections: payload.corrections ?? [],
        warnings: payload.warnings ?? [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed. Please try again.';
      setUploadError(message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    validateFile(file);
    event.target.value = '';
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    validateFile(file);
  };

  const deleteSalesGroups = async (groupIds: string[]) => {
    for (const groupId of groupIds) {
      const response = await authFetch(
        `${API_BASE_URL}/sales-groups/?sales_group_id=${encodeURIComponent(groupId)}`,
        {
          method: 'DELETE',
        }
      );

      if (response.status === 401) {
        throw new Error('Your session expired. Please sign in again.');
      }

      if (!response.ok) {
        let message = 'Could not delete sales group.';
        try {
          const payload = (await response.json()) as { detail?: string };
          if (payload?.detail) {
            message = payload.detail;
          }
        } catch {
          const fallback = await response.text();
          if (fallback) {
            message = fallback;
          }
        }
        throw new Error(message);
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeletingGroup(true);
    setDeleteError(null);

    try {
      await deleteSalesGroups([groupToDelete.id]);
      const newGroups = localSalesGroups.filter(group => group.id !== groupToDelete.id);
      setLocalSalesGroups(newGroups);
      onReorder(newGroups);
      setGroupToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete sales group.';
      setDeleteError(message);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const toggleSelectGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedGroupIds(new Set());
  };

  const selectAllFiltered = () => {
    setSelectedGroupIds(new Set(filteredGroups.map((group) => group.id)));
  };

  const handleBulkPin = () => {
    if (!hasSelection) return;
    const shouldPin = hasUnpinnedSelected;
    const updatedGroups = localSalesGroups.map((group) =>
      selectedGroupIds.has(group.id) ? { ...group, isPinned: shouldPin } : group
    );
    setLocalSalesGroups(updatedGroups);
    onReorder(updatedGroups);
  };

  const handleBulkExport = () => {
    selectedGroups.forEach((group) => {
      void exportToExcel(group);
    });
  };

  const handleBulkDelete = async () => {
    if (!hasSelection) return;

    setIsDeletingGroup(true);
    setDeleteError(null);

    try {
      const idsToDelete = Array.from(selectedGroupIds);
      await deleteSalesGroups(idsToDelete);
      const updatedGroups = localSalesGroups.filter((group) => !selectedGroupIds.has(group.id));
      setLocalSalesGroups(updatedGroups);
      onReorder(updatedGroups);
      clearSelection();
      setIsBulkDeleteOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete sales groups.';
      setDeleteError(message);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const enterSelectionMode = (groupId: string) => {
    setSelectionMode(true);
    setSelectedGroupIds(new Set([groupId]));
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
            <div className="flex items-center gap-3">
              <h1>Manage Sales Groups</h1>
              <Badge className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/30 shadow-sm ml-4 mt-1 dark:bg-primary/25 dark:text-primary dark:border-primary/55">
                {localSalesGroups.length} Sales Groups
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Select or create a Sales Group to upload data
            </p>
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

        {selectionMode && hasSelection && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="text-sm">
              <span className="font-medium">{selectedGroupIds.size}</span> selected
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkPin}>
                {hasUnpinnedSelected ? 'Pin selected' : 'Unpin selected'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkExport} className="gap-2">
                <Download size={14} />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="gap-2"
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-4 space-y-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
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
              {searchTerm || selectedCategories.length > 0 || pinnedOnly
                ? "We couldn't find any sales groups matching your search or filter criteria. Try adjusting your filters."
                : "You haven't created any sales groups yet. Get started by creating your first sales group."}
            </p>
            {(searchTerm || selectedCategories.length > 0 || pinnedOnly) ? (
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
            ) : (
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus size={16} />
                Create First Sales Group
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Sales Groups Grid */}
            <DndProvider backend={HTML5Backend}>
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${selectionMode ? 'selection-mode' : ''}`}>
                {filteredGroups.map((group) => (
                  <DraggableCard
                    key={group.id}
                    group={group}
                    indexById={indexById}
                    swapCards={swapCards}
                    commitReorder={commitReorder}
                    onSelectGroup={handleSelectGroup}
                    onDeleteGroup={setGroupToDelete}
                    onTogglePin={onTogglePin}
                    getStatusColor={getStatusColor}
                    isSelected={selectedGroupIds.has(group.id)}
                    onToggleSelect={toggleSelectGroup}
                    selectionMode={selectionMode}
                    onEnterSelectionMode={enterSelectionMode}
                  />
                ))}
              </div>
            </DndProvider>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={groupToDelete !== null} onOpenChange={(open) => !open && setGroupToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sales Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{groupToDelete?.name}"? This action cannot be undone and all associated data will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError ? (
                  <p className="text-sm text-destructive">{deleteError}</p>
                ) : null}
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setGroupToDelete(null)} disabled={isDeletingGroup}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleDeleteGroup()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeletingGroup}
                  >
                    {isDeletingGroup ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation */}
            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete selected sales groups</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to delete {selectedGroupIds.size} sales groups. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError ? (
                  <p className="text-sm text-destructive">{deleteError}</p>
                ) : null}
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsBulkDeleteOpen(false)} disabled={isDeletingGroup}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void handleBulkDelete()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeletingGroup}
                  >
                    {isDeletingGroup ? 'Deleting...' : 'Delete Selected'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
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

      {(() => {
        const stepLabels = ['Configure', 'Validate', 'Upload'];
        const currentStep = uploadResult ? 3 : validationResult ? 2 : 1;
        const progressPercent = ((currentStep - 1) / (stepLabels.length - 1)) * 100;
        return (
          <div className="space-y-3">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              {stepLabels.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber <= currentStep;
                return (
                  <div key={label} className={`flex items-center gap-2 ${isActive ? 'text-primary' : ''}`}>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {stepNumber}
                    </span>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>{selectedGroup ? 'Update' : 'Create'} Sales Group</h1>
          <p className="text-muted-foreground mt-1">
            {selectedGroup ? 'Upload new data to existing sales group' : 'Configure and upload data for new sales group'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={() => void handleSaveGroup()} disabled={!groupName.trim() || isSavingGroup}>
            {isSavingGroup ? 'Saving...' : 'Save Sales Group'}
          </Button>
          {groupSaveError ? (
            <p className="max-w-xs text-right text-sm text-destructive">{groupSaveError}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <Badge variant="secondary">{selectedGroup ? 'Existing group' : 'New group'}</Badge>
        <span className="text-sm text-muted-foreground">
          {selectedGroup ? `Last upload: ${selectedGroup.lastUpload}` : 'No uploads yet'}
        </span>
        <span className="text-sm text-muted-foreground">
          Status: {selectedGroup ? selectedGroup.status.replace('-', ' ') : 'needs data'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                className="border-primary/40 bg-primary/5 focus-visible:ring-primary/40"
              />
              {!groupName.trim() && (
                <p className="text-xs text-amber-700">A name is required to save the sales group.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of this sales group..."
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="border-primary/40 bg-primary/5 focus-visible:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="e.g., Category, Region, Channel (comma-separated)"
                value={groupTags}
                onChange={(e) => setGroupTags(e.target.value)}
                className="border-primary/40 bg-primary/5 focus-visible:ring-primary/40"
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
            onClick={openFilePicker}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="mb-2">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-muted-foreground">Excel (.xlsx, .xls) files</p>
            <p className="text-xs text-muted-foreground mt-4">
              Expected columns: Date, Sales Volume, Price(optional)
            </p>
          </div>
          {selectedFile && (
            <div className="text-xs text-muted-foreground">
              Selected file: {selectedFile.name} • {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {isValidating && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm text-blue-900">Validating data...</span>
            </div>
          )}

          {isUploading && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm text-blue-900">Uploading data...</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-900">{uploadError}</span>
            </div>
          )}

          {validationResult && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  validationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600 animate-successPop" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${validationResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                    {validationResult.message}
                  </p>
                  <p className={`text-xs mt-1 ${validationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                    {validationResult.row_count.toLocaleString()} rows processed
                    {validationResult.date_range.length === 2
                      ? ` • Date range: ${validationResult.date_range[0]} - ${validationResult.date_range[1]}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/40">
                <h4 className="text-sm font-medium">Detected Columns</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Date, Sales Volume{validationResult.has_price ? ', Price' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Date column mode: <span className="font-medium text-foreground">{validationResult.date_column_mode}</span>
                </p>
              </div>

              {qualityScore !== null && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${qualityTone(qualityScore)}`}>
                  Data quality score: <strong>{qualityScore}/100</strong>
                </div>
              )}

              {validationResult.corrections.length > 0 && (
                <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                  <h4 className="mb-2">Corrections</h4>
                  <ul className="text-sm text-amber-900 list-disc list-inside space-y-1">
                    {validationResult.corrections.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                  <h4 className="mb-2">Warnings</h4>
                  <ul className="text-sm text-amber-900 list-disc list-inside space-y-1">
                    {validationResult.warnings.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setValidationResult(null);
                    setUploadResult(null);
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleFileUpload();
                  }}
                  className="gap-2"
                  disabled={isUploading || !selectedFile || !validationResult.valid}
                >
                  Confirm Upload
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="space-y-4 border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 animate-successPop" />
                <div>
                  <p className="text-sm text-green-900">{uploadResult.message}</p>
                  <p className="text-xs text-green-700 mt-1">
                    Upload ID: {uploadResult.upload_id} • File: {uploadResult.filename}
                  </p>
                </div>
              </div>

              {qualityScore !== null && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${qualityTone(qualityScore)}`}>
                  Data quality score: <strong>{qualityScore}/100</strong>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-green-900">
                <div>Created at: {uploadResult.created_at}</div>
                <div>Rows: {uploadResult.row_count.toLocaleString()}</div>
                <div>
                  Date range:{' '}
                  {uploadResult.date_range.length === 2
                    ? `${uploadResult.date_range[0]} - ${uploadResult.date_range[1]}`
                    : 'N/A'}
                </div>
                <div>Has price: {uploadResult.has_price ? 'Yes' : 'No'}</div>
                <div>Date column mode: {uploadResult.date_column_mode}</div>
              </div>

              {uploadResult.corrections.length > 0 && (
                <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                  <h4 className="mb-2 text-sm text-amber-900">Corrections</h4>
                  <ul className="text-xs text-amber-900 list-disc list-inside space-y-1">
                    {uploadResult.corrections.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadResult.warnings.length > 0 && (
                <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                  <h4 className="mb-2 text-sm text-amber-900">Warnings</h4>
                  <ul className="text-xs text-amber-900 list-disc list-inside space-y-1">
                    {uploadResult.warnings.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setStep('select');
                  }}
                >
                  Back to Sales Groups
                </Button>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DraggableCardProps {
  group: SalesGroup;
  indexById: Map<string, number>;
  swapCards: (dragIndex: number, hoverIndex: number) => void;
  commitReorder: () => void;
  onSelectGroup: (group: SalesGroup) => void;
  onDeleteGroup: (group: SalesGroup) => void;
  onTogglePin: (groupId: string) => void;
  getStatusColor: (status: string) => string;
  isSelected: boolean;
  onToggleSelect: (groupId: string) => void;
  selectionMode: boolean;
  onEnterSelectionMode: (groupId: string) => void;
}

const DraggableCard = memo(function DraggableCard({
  group,
  indexById,
  swapCards,
  commitReorder,
  onSelectGroup,
  onDeleteGroup,
  onTogglePin,
  getStatusColor,
  isSelected,
  onToggleSelect,
  selectionMode,
  onEnterSelectionMode,
}: DraggableCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'CARD',
    item: (): DragItem => ({ id: group.id, originalIndex: indexById.get(group.id) ?? -1, hasMoved: false }),
    end: (item: DragItem | undefined) => {
      if (!item || !item.hasMoved) return;
      commitReorder();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CARD',
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;
      if (!monitor.isOver({ shallow: true })) return;

      const dragIndex = indexById.get(item.id) ?? -1;
      const hoverIndex = indexById.get(group.id) ?? -1;

      if (dragIndex === -1 || hoverIndex === -1) return;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const isPointerInsideTarget =
        clientOffset.x >= hoverBoundingRect.left &&
        clientOffset.x <= hoverBoundingRect.right &&
        clientOffset.y >= hoverBoundingRect.top &&
        clientOffset.y <= hoverBoundingRect.bottom;
      if (!isPointerInsideTarget) return;

      swapCards(dragIndex, hoverIndex);
      item.hasMoved = true;
    },
  });

  drag(dragHandleRef);
  drop(ref);

  const startLongPress = (event: React.PointerEvent<HTMLDivElement>) => {
    if (selectionMode) return;
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('label')) return;
    longPressTriggeredRef.current = false;
    pressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onEnterSelectionMode(group.id);
    }, 420);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || !longPressTimerRef.current) return;
    const dx = event.clientX - pressStartRef.current.x;
    const dy = event.clientY - pressStartRef.current.y;
    if (Math.hypot(dx, dy) > 8) {
      clearLongPress();
    }
  };

  return (
    <div
      ref={ref}
      data-sales-group-card
      style={{ opacity: isDragging ? 0.55 : 1 }}
      onPointerDown={startLongPress}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
    >
      <Card
        className={`sales-group-card cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative group ${
          isSelected ? 'sales-group-card-selected' : ''
        }`}
        onClick={() => {
          if (longPressTriggeredRef.current) {
            longPressTriggeredRef.current = false;
            return;
          }
          if (selectionMode) {
            onToggleSelect(group.id);
            return;
          }
          onSelectGroup(group);
        }}
      >
        <div className={`absolute top-2 right-2 transition-opacity z-20 ${group.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
        <div className="absolute top-2 right-12 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              void exportToExcel(group);
            }}
            title="Export to Excel"
          >
            <Download size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group);
            }}
          >
            <Trash2 size={18} />
          </Button>
        </div>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <button
              ref={dragHandleRef}
              type="button"
              className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/60"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label={`Reorder ${group.name}`}
              title="Drag to reorder"
            >
              <GripVertical size={16} className="text-muted-foreground" />
            </button>
            {group.name}
          </CardTitle>
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
    </div>
  );
});
