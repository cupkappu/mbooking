'use client';

import { useState } from 'react';
import { useJournalEntries, useAccounts, useCreateJournalEntry } from '@/hooks/use-api';
import type { JournalEntry, Account } from '@/types';

export default function JournalPage() {
  const { data: journalData, isLoading, refetch } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const createEntry = useCreateJournalEntry();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { account_id: '', amount: 0, currency: 'USD', tags: [] as string[] },
      { account_id: '', amount: 0, currency: 'USD', tags: [] as string[] },
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredLines = formData.lines.filter((line) => line.account_id && line.amount !== 0);
    
    await createEntry.mutateAsync({
      date: formData.date,
      description: formData.description,
      lines: filteredLines,
    });
    
    setShowForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [
        { account_id: '', amount: 0, currency: 'USD', tags: [] },
        { account_id: '', amount: 0, currency: 'USD', tags: [] },
      ],
    });
    refetch();
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { account_id: '', amount: 0, currency: 'USD', tags: [] }],
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const getAccountName = (id: string): string => {
    const account = accounts?.find((a: Account) => a.id === id);
    return account?.path || 'Unknown';
  };

  const calculateTotal = (lines: typeof formData.lines): number => {
    return lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Journal</h1>
          <p className="text-muted-foreground">Record your financial transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          New Entry
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Create Journal Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Journal Lines</label>
              {formData.lines.map((line, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={line.account_id}
                    onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((account: Account) => (
                      <option key={account.id} value={account.id}>
                        {account.path} ({account.type})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={line.amount}
                    onChange={(e) => updateLine(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 border rounded-md"
                    placeholder="Amount"
                    required
                  />
                  <input
                    type="text"
                    value={line.currency}
                    onChange={(e) => updateLine(index, 'currency', e.target.value.toUpperCase())}
                    className="w-20 px-3 py-2 border rounded-md"
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addLine}
                className="text-sm text-primary hover:underline"
              >
                + Add Line
              </button>
            </div>

            <div className="p-4 bg-muted rounded-md">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className={calculateTotal(formData.lines) !== 0 ? 'text-red-500' : ''}>
                  {calculateTotal(formData.lines).toFixed(2)}
                </span>
              </div>
              {calculateTotal(formData.lines) !== 0 && (
                <p className="text-xs text-red-500 mt-1">Entry must balance (total = 0)</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createEntry.isPending || calculateTotal(formData.lines) !== 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {createEntry.isPending ? 'Creating...' : 'Create Entry'}
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

      <div className="space-y-4">
        {journalData?.entries?.map((entry: JournalEntry) => (
          <div key={entry.id} className="p-6 bg-card rounded-lg border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
                <h3 className="font-semibold">{entry.description}</h3>
              </div>
            </div>
            <div className="space-y-2">
              {entry.lines?.map((line, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{getAccountName(line.account_id)}</span>
                  <span className={line.amount < 0 ? 'text-red-500' : 'text-green-500'}>
                    {line.amount < 0 ? '-' : '+'}
                    ${Math.abs(line.amount).toFixed(2)} {line.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!journalData?.entries || journalData.entries.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No journal entries yet. Create your first entry to record a transaction.
          </p>
        )}
      </div>
    </div>
  );
}
