'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Settings, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { providersApi } from '@/lib/providers';
import type { RateProvider } from '@/types/provider';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<RateProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'api' as const,
    api_url: '',
    api_key: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    config: { api_url: '', api_key: '' },
    is_active: true,
    is_default: false,
    priority: 0,
  });

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await providersApi.getAll();
      setProviders(data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleAddProvider = async () => {
    if (!newProvider.name) return;

    try {
      await providersApi.create({
        name: newProvider.name,
        type: newProvider.type,
        config: {
          api_url: newProvider.api_url,
          api_key: newProvider.api_key,
        },
      });
      setNewProvider({ name: '', type: 'api', api_url: '', api_key: '' });
      await fetchProviders();
    } catch (error) {
      console.error('Failed to add provider:', error);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      await providersApi.delete(id);
      await fetchProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await providersApi.setDefault(id);
      await fetchProviders();
    } catch (error) {
      console.error('Failed to set default provider:', error);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    try {
      const result = await providersApi.testConnection(id);
      alert(result.message);
    } catch (error) {
      alert('Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const startEditing = (provider: RateProvider) => {
    setEditingProvider(provider.id);
    const config = provider.config as { api_url?: string; api_key?: string } || {};
    setEditForm({
      name: provider.name,
      config: {
        api_url: config.api_url || '',
        api_key: config.api_key || '',
      },
      is_active: provider.is_active,
      is_default: provider.is_default,
      priority: provider.priority,
    });
  };

  const cancelEditing = () => {
    setEditingProvider(null);
    setEditForm({
      name: '',
      config: { api_url: '', api_key: '' },
      is_active: true,
      is_default: false,
      priority: 0,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await providersApi.update(id, editForm);
      cancelEditing();
      await fetchProviders();
    } catch (error) {
      console.error('Failed to update provider:', error);
    }
  };

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'builtin':
        return 'Built-in';
      case 'api':
        return 'API';
      case 'file':
        return 'File';
      case 'custom':
        return 'Custom';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rate Providers</h1>
        <p className="text-muted-foreground">Manage exchange rate providers for currency conversion</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Provider</CardTitle>
          <CardDescription>Configure a new exchange rate provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input
                id="provider-name"
                placeholder="Exchange Rate API"
                value={newProvider.name}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-type">Type</Label>
              <Select
                value={newProvider.type}
                onValueChange={(value: any) => setNewProvider({ ...newProvider, type: value })}
              >
                <SelectTrigger id="provider-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builtin">Built-in</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newProvider.type === 'api' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api-url">API URL</Label>
                  <Input
                    id="api-url"
                    placeholder="https://api.exchangerate.host/latest"
                    value={newProvider.api_url}
                    onChange={(e) => setNewProvider({ ...newProvider, api_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key (optional)</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Your API key"
                    value={newProvider.api_key}
                    onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <Button onClick={handleAddProvider} disabled={!newProvider.name} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Management</CardTitle>
          <CardDescription>View and manage your exchange rate providers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  {editingProvider === provider.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>{getProviderTypeLabel(provider.type)}</TableCell>
                      <TableCell>
                        <Select
                          value={editForm.is_active ? 'active' : 'inactive'}
                          onValueChange={(value) => setEditForm({ ...editForm, is_active: value === 'active' })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20"
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={editForm.is_default ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditForm({ ...editForm, is_default: !editForm.is_default })}
                        >
                          {editForm.is_default ? 'Default' : 'Set'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(provider.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>{getProviderTypeLabel(provider.type)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          provider.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>{provider.priority}</TableCell>
                      <TableCell>
                        {provider.is_default && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Default
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!provider.is_default && provider.is_active && (
                          <Button variant="ghost" size="sm" onClick={() => handleSetDefault(provider.id)}>
                            Set Default
                          </Button>
                        )}
                        {provider.type === 'api' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(provider.id)}
                            disabled={testingConnection === provider.id}
                          >
                            <RefreshCw className={`w-4 h-4 ${testingConnection === provider.id ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => startEditing(provider)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProvider(provider.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {providers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No providers found. Add a provider above to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
