import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { Plus, Edit, Trash2, TrendingUp, BarChart3, Search, RefreshCw, Coins } from "lucide-react";

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewTicker {
  symbol: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

export default function TickersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null);
  const [newTicker, setNewTicker] = useState<NewTicker>({
    symbol: '',
    description: '',
    category: 'cryptocurrency',
    isEnabled: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickers
  const { data: tickers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/tickers'],
    queryFn: () => apiRequest('/api/admin/tickers')
  });

  // Create ticker mutation
  const createMutation = useMutation({
    mutationFn: (ticker: NewTicker) => 
      apiRequest('/api/admin/tickers', {
        method: 'POST',
        body: JSON.stringify(ticker)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickers'] });
      setShowCreateDialog(false);
      setNewTicker({
        symbol: '',
        description: '',
        category: 'cryptocurrency',
        isEnabled: true
      });
      toast({
        title: "Success",
        description: "Ticker created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticker",
        variant: "destructive"
      });
    }
  });

  // Update ticker mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Ticker> }) =>
      apiRequest(`/api/admin/tickers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickers'] });
      setShowEditDialog(false);
      setSelectedTicker(null);
      toast({
        title: "Success",
        description: "Ticker updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticker",
        variant: "destructive"
      });
    }
  });

  // Delete ticker mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/tickers/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickers'] });
      toast({
        title: "Success",
        description: "Ticker deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticker",
        variant: "destructive"
      });
    }
  });

  const filteredTickers = tickers.filter((ticker: Ticker) =>
    ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticker.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticker.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledTickers = tickers.filter((ticker: Ticker) => ticker.isEnabled).length;
  const totalTickers = tickers.length;

  const handleCreateTicker = () => {
    if (!newTicker.symbol || !newTicker.description) {
      toast({
        title: "Validation Error",
        description: "Symbol and description are required",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(newTicker);
  };

  const handleUpdateTicker = (updates: Partial<Ticker>) => {
    if (!selectedTicker) return;
    updateMutation.mutate({ id: selectedTicker.id, updates });
  };

  const handleDeleteTicker = (id: string) => {
    if (confirm('Are you sure you want to delete this ticker?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (ticker: Ticker) => {
    setSelectedTicker(ticker);
    setShowEditDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex">
        <Sidebar className="flex-none w-64 hidden lg:block" />
        <div className="flex-1 min-h-screen lg:ml-64">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Ticker Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage trading symbols and their configurations
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ticker
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Ticker</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      value={newTicker.symbol}
                      onChange={(e) => setNewTicker(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                      placeholder="e.g. BTCUSDT"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={newTicker.description}
                      onChange={(e) => setNewTicker(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Bitcoin / Tether USD"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTicker.category} onValueChange={(value) => setNewTicker(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newTicker.isEnabled}
                      onCheckedChange={(checked) => setNewTicker(prev => ({ ...prev, isEnabled: checked }))}
                    />
                    <Label htmlFor="enabled">Enable immediately</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateTicker}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Ticker"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tickers
              </CardTitle>
              <Coins className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {totalTickers}
              </div>
              <p className="text-xs text-gray-500 mt-1">Symbols managed</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Enabled
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {enabledTickers}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active tickers</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Disabled
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totalTickers - enabledTickers}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inactive tickers</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Enable Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totalTickers > 0 ? Math.round((enabledTickers / totalTickers) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Active ratio</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters - Responsive */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by symbol, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tickers Table - Responsive */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tickers ({filteredTickers.length})</span>
              {filteredTickers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Math.round((enabledTickers / totalTickers) * 100)}% Enabled
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading tickers...</p>
              </div>
            ) : filteredTickers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tickers found</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile Card View (hidden on lg+) */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredTickers.map((ticker: Ticker) => (
                    <Card key={ticker.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{ticker.symbol}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ticker.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(ticker)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTicker(ticker.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{ticker.category}</Badge>
                          <Badge 
                            variant={ticker.isEnabled ? "default" : "secondary"}
                            className={ticker.isEnabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                          >
                            {ticker.isEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Created: {new Date(ticker.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View (hidden on mobile) */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Symbol</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Description</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Category</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Created</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickers.map((ticker: Ticker) => (
                        <tr key={ticker.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-lg font-mono">{ticker.symbol}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-900 dark:text-white">{ticker.description}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">{ticker.category}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant={ticker.isEnabled ? "default" : "secondary"}
                              className={ticker.isEnabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                            >
                              {ticker.isEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(ticker.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(ticker)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTicker(ticker.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Ticker</DialogTitle>
            </DialogHeader>
            {selectedTicker && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-symbol">Symbol</Label>
                  <Input
                    id="edit-symbol"
                    value={selectedTicker.symbol}
                    onChange={(e) => setSelectedTicker(prev => prev ? { ...prev, symbol: e.target.value.toUpperCase() } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={selectedTicker.description}
                    onChange={(e) => setSelectedTicker(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={selectedTicker.category} 
                    onValueChange={(value) => setSelectedTicker(prev => prev ? { ...prev, category: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-enabled"
                    checked={selectedTicker.isEnabled}
                    onCheckedChange={(checked) => setSelectedTicker(prev => prev ? { ...prev, isEnabled: checked } : null)}
                  />
                  <Label htmlFor="edit-enabled">Enabled</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => selectedTicker && handleUpdateTicker(selectedTicker)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Ticker"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}