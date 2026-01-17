import { Button } from './ui/button';
import { X } from 'lucide-react';

interface CategorySlicerProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const allCategories = [
  'All',
  'Milk',
  'Juice',
  'Yogurt',
  'Cream',
  'Butter',
  'importation',
];

export function CategorySlicer({ selectedCategories, onCategoryChange }: CategorySlicerProps) {
  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
      onCategoryChange([]);
      return;
    }

    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  const isActive = (category: string) => {
    if (category === 'All') {
      return selectedCategories.length === 0;
    }
    return selectedCategories.includes(category);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm">Filter by Category</h4>
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-auto py-1 px-2 text-xs gap-1"
          >
            <X size={12} />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allCategories.map((category) => (
          <Button
            key={category}
            variant={isActive(category) ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryClick(category)}
            className="text-xs h-8"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
