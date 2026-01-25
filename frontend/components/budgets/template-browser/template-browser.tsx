'use client';

import { useState } from 'react';
import { useBudgetTemplates } from '@/hooks/use-budget-templates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { BudgetTemplate } from '@/types';
import { cn } from '@/lib/utils';

interface TemplateBrowserProps {
  onSelectTemplate: (template: BudgetTemplate) => void;
  onClose?: () => void;
}

const categoryColors: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  business: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  savings: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export function TemplateBrowser({ onSelectTemplate, onClose }: TemplateBrowserProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useBudgetTemplates({
    category: categoryFilter || undefined,
  });

  const filteredTemplates = data?.data.filter((template) =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (template: BudgetTemplate) => {
    setSelectedId(template.id);
    onSelectTemplate(template);
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Error loading templates</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Budget Templates</h2>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
          <option value="savings">Savings</option>
          <option value="expense">Expense</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-3/4 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded mb-4 animate-pulse" />
              <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No templates found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onSelect={() => handleSelect(template)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: BudgetTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const categoryClass = categoryColors[template.category] || categoryColors.custom;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary bg-primary/5'
          : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold truncate">{template.name}</h3>
          <Badge className={`mt-1 ${categoryClass}`}>
            {template.category}
          </Badge>
        </div>
        {isSelected && (
          <div className="p-1 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-xs">✓</span>
          </div>
        )}
      </div>

      {template.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {template.default_currency} {template.default_amount?.toLocaleString() || 'Custom'}
          </span>
        </div>
        {template.is_system_template && (
          <Badge variant="outline" className="text-xs">
            System
          </Badge>
        )}
      </div>

      {template.suggested_categories && template.suggested_categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {template.suggested_categories.slice(0, 3).map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {template.suggested_categories.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.suggested_categories.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
