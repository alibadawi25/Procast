import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Skeleton } from './ui/skeleton';
import { Calendar, Search, Star, User, MessageSquare, Filter, Edit3, Check, X } from 'lucide-react';
import { CategorySlicer } from './CategorySlicer';
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

interface SalesGroup {
  id: string;
  name: string;
  timeSpan: string;
  lastUpload: string;
  status: 'ready' | 'needs-data' | 'forecasted';
  tags: string[];
  isPinned?: boolean;
}

type NoteType = 'Assumption' | 'Risk' | 'Action' | 'Issue' | 'Decision';

interface NoteItem {
  id: string;
  groupId: string;
  author: string;
  createdAt: string;
  type: NoteType;
  text: string;
  pinned: boolean;
  resolved: boolean;
}

interface CollaboratorNotesProps {
  salesGroups: SalesGroup[];
  isLoading: boolean;
}

const typeStyles: Record<NoteType, string> = {
  Assumption: 'bg-blue-100 text-blue-700',
  Risk: 'bg-amber-100 text-amber-700',
  Action: 'bg-green-100 text-green-700',
  Issue: 'bg-red-100 text-red-700',
  Decision: 'bg-purple-100 text-purple-700',
};

const initialNotes: NoteItem[] = [
  {
    id: 'n1',
    groupId: '1',
    author: 'Yussef Ehab',
    createdAt: '2026-03-12 09:14',
    type: 'Decision',
    text: 'Lock forecast horizon to 12 months for planning cycle.',
    pinned: true,
    resolved: false,
  },
  {
    id: 'n2',
    groupId: '2',
    author: 'Mariam Ali',
    createdAt: '2026-03-11 16:03',
    type: 'Risk',
    text: 'Promo calendar missing for Q3; results may be under-estimated.',
    pinned: false,
    resolved: false,
  },
  {
    id: 'n3',
    groupId: '3',
    author: 'Ahmed Samy',
    createdAt: '2026-03-10 11:22',
    type: 'Action',
    text: 'Re-upload latest POS data once retailer feed is fixed.',
    pinned: false,
    resolved: true,
  },
];

export function CollaboratorNotes({ salesGroups, isLoading }: CollaboratorNotesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [noteType, setNoteType] = useState<NoteType>('Assumption');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [activeTypes, setActiveTypes] = useState<NoteType[]>([]);
  const [hideResolved, setHideResolved] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const availableCategories = useMemo(
    () => Array.from(new Set(salesGroups.flatMap((group) => group.tags))).sort(),
    [salesGroups]
  );

  const groupById = useMemo(() => {
    const map = new Map<string, SalesGroup>();
    salesGroups.forEach((group) => map.set(group.id, group));
    return map;
  }, [salesGroups]);

  const filteredGroups = useMemo(() => {
    return salesGroups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 || group.tags.some((tag) => selectedCategories.includes(tag));
      const matchesPinned = !pinnedOnly || Boolean(group.isPinned);
      return matchesSearch && matchesCategory && matchesPinned;
    });
  }, [salesGroups, searchTerm, selectedCategories, pinnedOnly]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (selectedGroupId === 'all') return true;
        return note.groupId === selectedGroupId;
      })
      .filter((note) => {
        if (!searchTerm) return true;
        return note.text.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .filter((note) => (activeTypes.length === 0 ? true : activeTypes.includes(note.type)))
      .filter((note) => (hideResolved ? !note.resolved : true))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes, selectedGroupId, searchTerm, activeTypes, hideResolved]);

  const mentionCount = useMemo(() => {
    return notes.reduce((count, note) => count + (/@[a-z0-9_]+/i.test(note.text) ? 1 : 0), 0);
  }, [notes]);

  const toggleTypeFilter = (type: NoteType) => {
    setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const startEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const saveEdit = (noteId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setNotes((prev) => prev.map((item) => (item.id === noteId ? { ...item, text: trimmed } : item)));
    cancelEdit();
  };

  const renderWithMentions = (text: string) => {
    const parts = text.split(/(@[a-z0-9_]+)/gi);
    return parts.map((part, index) => {
      if (/^@[a-z0-9_]+$/i.test(part)) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleAddNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const groupId = selectedGroupId === 'all' ? salesGroups[0]?.id ?? '1' : selectedGroupId;
    const newNote: NoteItem = {
      id: `n-${Date.now()}`,
      groupId,
      author: 'Yussef Ehab',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: noteType,
      text: trimmed,
      pinned: false,
      resolved: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Collaborator Notes</h1>
        <p className="text-muted-foreground mt-1">Capture assumptions, risks, and decisions for each sales group</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Notes Board
              {mentionCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {mentionCount} mentions
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search notes, @mentions, or keywords..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={filtersOpen ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className="gap-2"
                >
                  <Filter size={14} />
                  Filters
                </Button>
                <Button
                  variant={pinnedOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPinnedOnly((prev) => !prev)}
                  className="gap-2"
                >
                  <Star size={14} className={pinnedOnly ? 'fill-current' : ''} />
                  Pinned
                </Button>
                <Button
                  variant={hideResolved ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHideResolved((prev) => !prev)}
                >
                  Hide resolved
                </Button>
              </div>
            </div>

            {filtersOpen && (
              <Card className="border-dashed">
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Categories</span>
                    <CategorySlicer
                      categories={availableCategories}
                      selectedCategories={selectedCategories}
                      onCategoryChange={setSelectedCategories}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Note type</span>
                    {(['Assumption', 'Risk', 'Action', 'Issue', 'Decision'] as NoteType[]).map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={activeTypes.includes(type) ? 'default' : 'outline'}
                        onClick={() => toggleTypeFilter(type)}
                      >
                        {type}
                      </Button>
                    ))}
                    {activeTypes.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setActiveTypes([])}>
                        Clear types
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Sales Group</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedGroupId === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedGroupId('all')}
                >
                  All groups
                </Button>
                {filteredGroups.map((group) => (
                  <Button
                    key={group.id}
                    size="sm"
                    variant={selectedGroupId === group.id ? 'default' : 'outline'}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No notes yet for this filter. Add the first note to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => {
                  const group = groupById.get(note.groupId);
                  return (
                    <Card key={note.id} className="border-border/70">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={typeStyles[note.type]}>{note.type}</Badge>
                              {note.pinned && <Star size={14} className="text-amber-500 fill-amber-500" />}
                              {note.resolved && <Badge variant="secondary">Resolved</Badge>}
                            </div>
                            {editingNoteId === note.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingText}
                                  onChange={(event) => setEditingText(event.target.value)}
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(note.id)} disabled={!editingText.trim()}>
                                    <Check size={14} />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    <X size={14} />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{renderWithMentions(note.text)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setNotes((prev) =>
                                  prev.map((item) =>
                                    item.id === note.id ? { ...item, resolved: !item.resolved } : item
                                  )
                                )
                              }
                              title={note.resolved ? 'Mark unresolved' : 'Mark resolved'}
                            >
                              <Check size={16} className={note.resolved ? 'text-green-600' : ''} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEdit(note)}
                              title="Edit note"
                            >
                              <Edit3 size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setNotes((prev) =>
                                  prev.map((item) =>
                                    item.id === note.id ? { ...item, pinned: !item.pinned } : item
                                  )
                                )
                              }
                              title={note.pinned ? 'Unpin note' : 'Pin note'}
                            >
                              <Star size={16} className={note.pinned ? 'text-amber-500 fill-amber-500' : ''} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setNoteToDelete(note)}
                              title="Delete note"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User size={12} /> {note.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {note.createdAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} /> {group?.name ?? 'Unknown group'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={noteToDelete !== null} onOpenChange={(open) => !open && setNoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this note? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!noteToDelete) return;
                  setNotes((prev) => prev.filter((item) => item.id !== noteToDelete.id));
                  setNoteToDelete(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <CardTitle>Add a Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Note type</span>
              <div className="flex flex-wrap gap-2">
                {(['Assumption', 'Risk', 'Action', 'Issue', 'Decision'] as NoteType[]).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={noteType === type ? 'default' : 'outline'}
                    onClick={() => setNoteType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Note content</span>
              <Textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Write a note about assumptions, risks, decisions, or actions..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Apply to group</span>
              <div className="flex flex-wrap gap-2">
                {salesGroups.map((group) => (
                  <Button
                    key={group.id}
                    size="sm"
                    variant={selectedGroupId === group.id ? 'default' : 'outline'}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteText('')}>
                Clear
              </Button>
              <Button onClick={handleAddNote} disabled={!noteText.trim()}>
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
