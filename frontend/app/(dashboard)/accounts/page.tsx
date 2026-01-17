'use client';

import { useState } from 'react';
import { useAccounts, useCreateAccount } from '@/hooks/use-api';
import type { Account } from '@/types';

export default function AccountsPage() {
  const { data: accounts, isLoading, refetch } = useAccounts();
  const createAccount = useCreateAccount();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'assets' as const,
    parent_id: '',
    currency: 'USD',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAccount.mutateAsync(formData);
    setShowForm(false);
    setFormData({ name: '', type: 'assets', parent_id: '', currency: 'USD' });
    refetch();
  };

  const accountTypes = ['assets', 'liabilities', 'equity', 'revenue', 'expense'];

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  const renderAccountTree = (parentId: string | null, level: number = 0): JSX.Element[] => {
    const children = accounts?.filter((a: Account) => a.parent_id === parentId) || [];
    
    return children.map((account: Account) => (
      <div key={account.id} className="ml-4">
        <div className="flex items-center gap-2 py-1">
          <span className="text-muted-foreground">{'─'.repeat(level)}</span>
          <span className="font-medium">{account.name}</span>
          <span className="text-xs px-2 py-0.5 bg-secondary rounded">{account.type}</span>
          <span className="text-xs text-muted-foreground">{account.currency}</span>
        </div>
        {renderAccountTree(account.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your chart of accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Account
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-md"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Account (optional)</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">None (Top Level)</option>
                  {accounts?.map((account: Account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createAccount.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {createAccount.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6 bg-card rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Account Tree</h2>
        {accounts && accounts.length > 0 ? (
          renderAccountTree(null)
        ) : (
          <p className="text-muted-foreground">No accounts yet. Create your first account to get started.</p>
        )}
      </div>
    </div>
  );
}
