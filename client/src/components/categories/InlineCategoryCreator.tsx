// client/src/components/categories/InlineCategoryCreator.tsx

// Inline dropdown selector with quick modal-free category creation for income and expense transactions.

'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Category, TransactionType } from '@/types';

interface InlineCategoryCreatorProps {
  categories: Category[];
  selectedCategoryId: string;
  transactionType: TransactionType;
  onSelectCategory: (categoryId: string) => void;
  onCategoryCreated?: (category: Category) => void;
  onError: (error: string) => void;
}

export function InlineCategoryCreator({
  categories,
  selectedCategoryId,
  transactionType,
  onSelectCategory,
  onCategoryCreated,
  onError,
}: InlineCategoryCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredCategories = categories.filter(
    (c) => c.type === (transactionType === 'income' ? 'income' : 'expense')
  );

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;

    setIsSaving(true);
    try {
      const created = await api.post<Category>('/categories', {
        name: newCategoryName.trim(),
        type: transactionType === 'income' ? 'income' : 'expense',
      });
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
      onSelectCategory(created.id || created._id || '');
      setNewCategoryName('');
      setIsCreating(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-fg">Category</label>
        <button
          type="button"
          onClick={() => setIsCreating((prev) => !prev)}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
        >
          <Plus className="w-3 h-3" />
          {isCreating ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {isCreating ? (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-surface-muted/20">
          <Input
            type="text"
            placeholder="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="grow"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={isSaving || !newCategoryName.trim()}
          >
            {isSaving ? 'Saving...' : 'Add'}
          </Button>
        </div>
      ) : (
        <Select
          value={selectedCategoryId}
          onChange={(e) => onSelectCategory(e.target.value)}
          options={[
            { value: '', label: 'Select a category' },
            ...filteredCategories.map((c) => ({
              value: c.id || c._id || '',
              label: c.name,
            })),
          ]}
        />
      )}
    </div>
  );
}
