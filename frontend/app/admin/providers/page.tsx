'use client';

// Force dynamic rendering to avoid SSR pre-rendering issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminProviders, useCreateProvider, useUpdateProvider, useToggleProvider, useTestProvider, useAvailablePlugins, Provider } from '@/hooks/use-admin';
import { Plus, Search, RefreshCw, Play, Power, CheckCircle, XCircle, FileCode, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminProvidersPage() {
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  
  // Create form state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'rest_api' as 'rest_api' | 'js_plugin',
    // REST API fields
    base_url: 'https://api.frankfurter.app',
    api_key: '',
    // JS Plugin fields
    selected_plugin_file: '',
    // Common fields
    record_history: true,
    supports_historical: true,
  });
  const [supportedCurrencies, setSupportedCurrencies] = useState('USD, EUR, GBP, JPY, CNY, HKD');
  
  // Edit form state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [editForm, setEditForm] = useState({ name: '', is_active: true, config: '{}' });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const { data, isLoading, refetch } = useAdminProviders({ offset, limit: 20 });
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const toggleProvider = useToggleProvider();
  const testProvider = useTestProvider();
  const { data: availablePlugins } = useAvailablePlugins();
  const { toast } = useToast();

  const handleCreateProvider = async () => {
    try {
      // Build config based on provider type
      let config: any = {};
      if (createForm.type === 'rest_api') {
        config = {
          base_url: createForm.base_url,
          ...(createForm.api_key && { api_key: createForm.api_key }),
        };
      } else {
        config = { file_path: createForm.selected_plugin_file };
      }

      // Parse supported currencies
      const currencies = supportedCurrencies
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(c => c.length > 0);

      await createProvider.mutateAsync({
        name: createForm.name,
        type: createForm.type,
        config,
        is_active: true,
        record_history: createForm.record_history,
        supports_historical: createForm.supports_historical,
        supported_currencies: currencies,
      });

      toast({ title: 'Provider created successfully' });
      setShowCreateDialog(false);
      setCreateForm({
        name: '',
        type: 'rest_api',
        base_url: 'https://api.frankfurter.app',
        api_key: '',
        selected_plugin_file: '',
        record_history: true,
        supports_historical: true,
      });
      setSupportedCurrencies('USD, EUR, GBP, JPY, CNY, HKD');
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateProvider = async () => {
    if (!selectedProvider) return;
    
    try {
      let config: any = {};
      try {
        config = JSON.parse(editForm.config);
      } catch {
        config = { base_url: editForm.config };
      }
      
      await updateProvider.mutateAsync({
        id: selectedProvider.id,
        data: {
          name: editForm.name,
          is_active: editForm.is_active,
          config,
        },
      });
      
      toast({ title: 'Provider updated successfully' });
      setShowEditDialog(false);
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleProvider = async (id: string) => {
    try {
      await toggleProvider.mutateAsync(id);
      toast({ title: 'Provider toggled successfully' });
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleTestProvider = async (id: string) => {
    try {
      const result = await testProvider.mutateAsync(id);
      setTestResult(result);
      if (result.success) {
        toast({ title: 'Test successful', description: result.message });
      } else {
        toast({ title: 'Test failed', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (provider: Provider) => {
    setSelectedProvider(provider);
    setEditForm({
      name: provider.name,
      is_active: provider.is_active,
      config: JSON.stringify(provider.config, null, 2),
    });
    setShowEditDialog(true);
  };

  const filteredProviders = data?.providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Providers</h1>
          <p className="text-muted-foreground">Manage exchange rate providers</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Total {data?.total || 0} providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Currencies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No providers found</TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {provider.supported_currencies?.slice(0, 3).map((c) => (
                          <Badge key={c} variant="secondary">{c}</Badge>
                        ))}
                        {provider.supported_currencies?.length > 3 && (
                          <Badge variant="secondary">+{provider.supported_currencies.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                        {provider.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(provider.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleTestProvider(provider.id)}>
                          <Play className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleProvider(provider.id)}>
                          {provider.is_active ? <XCircle className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {offset + 1} - {Math.min(offset + 20, data.total)} of {data.total}
              </span>
              <Button variant="outline" onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= data.total}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Result Dialog */}
      {testResult && (
        <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Result</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span>{testResult.message}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setTestResult(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Provider Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Provider</DialogTitle>
            <DialogDescription>Add a new exchange rate provider</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="My Rate Provider"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={createForm.type}
                onValueChange={(value: 'rest_api' | 'js_plugin') => setCreateForm({ ...createForm, type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rest_api">REST API</SelectItem>
                  <SelectItem value="js_plugin">JS Plugin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* REST API Fields */}
            {createForm.type === 'rest_api' && (
              <>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    value={createForm.base_url}
                    onChange={(e) => setCreateForm({ ...createForm, base_url: e.target.value })}
                    placeholder="https://api.example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for the rate API (e.g., https://api.frankfurter.app)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>API Key (optional)</Label>
                  <Input
                    type="password"
                    value={createForm.api_key}
                    onChange={(e) => setCreateForm({ ...createForm, api_key: e.target.value })}
                    placeholder="Enter API key if required"
                  />
                </div>
              </>
            )}

            {/* JS Plugin Fields */}
            {createForm.type === 'js_plugin' && (
              <div className="space-y-2">
                <Label>Plugin</Label>
                <Select
                  value={createForm.selected_plugin_file}
                  onValueChange={(value) => setCreateForm({ ...createForm, selected_plugin_file: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plugin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlugins?.map((plugin) => (
                      <SelectItem key={plugin.file_path} value={plugin.file_path}>
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4" />
                          {plugin.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a JavaScript plugin file from the plugins directory
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Supported Currencies</Label>
              <Input
                value={supportedCurrencies}
                onChange={(e) => setSupportedCurrencies(e.target.value)}
                placeholder="USD, EUR, GBP, JPY"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of currency codes (e.g., USD, EUR, GBP, JPY, CNY, HKD)
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="record-history"
                  checked={createForm.record_history}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, record_history: checked })}
                />
                <Label htmlFor="record-history">Record History</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="supports-historical"
                  checked={createForm.supports_historical}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, supports_historical: checked })}
                />
                <Label htmlFor="supports-historical">Historical Rates</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateProvider}
              disabled={!createForm.name || createProvider.isPending || (createForm.type === 'js_plugin' && !createForm.selected_plugin_file)}
            >
              {createProvider.isPending ? 'Creating...' : 'Create Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
