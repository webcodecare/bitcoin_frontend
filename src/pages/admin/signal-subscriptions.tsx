import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../../components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  tickerSymbol: string;
  timeframe: string;
  deliveryMethods: string[];
  maxAlertsPerDay: number;
  isActive: boolean;
  subscribedAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
}

interface TickerTimeframe {
  id: string;
  tickerSymbol: string;
  timeframe: string;
  description: string;
  isEnabled: boolean;
}

export default function AdminSignalSubscriptions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);

  // New subscription form state
  const [newSubscription, setNewSubscription] = useState({
    userId: '',
    tickerSymbol: '',
    timeframe: '',
    deliveryMethods: ['email'] as string[],
    maxAlertsPerDay: 50
  });

  // Fetch user subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-user-subscriptions', searchTerm, selectedTicker, selectedTimeframe],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTicker) params.append('ticker', selectedTicker);
      if (selectedTimeframe) params.append('timeframe', selectedTimeframe);
      
      const response = await fetch(`/api/admin/user-subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    }
  });

  // Fetch users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-for-subscriptions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users-for-subscriptions');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch available ticker/timeframes
  const { data: tickerTimeframesData } = useQuery({
    queryKey: ['admin-ticker-timeframes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/ticker-timeframes');
      if (!response.ok) throw new Error('Failed to fetch ticker timeframes');
      return response.json();
    }
  });

  const subscriptions: UserSubscription[] = subscriptionsData?.subscriptions || [];
  const users: User[] = usersData?.users || [];
  const tickerTimeframes: TickerTimeframe[] = tickerTimeframesData?.combinations || [];

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: typeof newSubscription) => {
      const response = await fetch('/api/admin/user-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Subscription created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-user-subscriptions'] });
      setShowCreateDialog(false);
      setNewSubscription({
        userId: '',
        tickerSymbol: '',
        timeframe: '',
        deliveryMethods: ['email'],
        maxAlertsPerDay: 50
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserSubscription> }) => {
      const response = await fetch(`/api/admin/user-subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Subscription updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-user-subscriptions'] });
      setShowEditDialog(false);
      setSelectedSubscription(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/user-subscriptions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Subscription deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-user-subscriptions'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleDeliveryMethodChange = (method: string, checked: boolean, isEdit = false) => {
    if (isEdit && selectedSubscription) {
      const updatedMethods = checked
        ? [...selectedSubscription.deliveryMethods, method]
        : selectedSubscription.deliveryMethods.filter(m => m !== method);
      setSelectedSubscription({
        ...selectedSubscription,
        deliveryMethods: updatedMethods
      });
    } else {
      const updatedMethods = checked
        ? [...newSubscription.deliveryMethods, method]
        : newSubscription.deliveryMethods.filter(m => m !== method);
      setNewSubscription(prev => ({
        ...prev,
        deliveryMethods: updatedMethods
      }));
    }
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubscription.userId || !newSubscription.tickerSymbol || !newSubscription.timeframe) {
      toast({ 
        title: 'Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }
    createSubscriptionMutation.mutate(newSubscription);
  };

  const handleUpdateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription) return;
    
    updateSubscriptionMutation.mutate({
      id: selectedSubscription.id,
      data: {
        deliveryMethods: selectedSubscription.deliveryMethods,
        maxAlertsPerDay: selectedSubscription.maxAlertsPerDay,
        isActive: selectedSubscription.isActive
      }
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getDeliveryMethodIcons = (methods: string[]) => {
    return (
      <div className="flex gap-1">
        {methods.includes('email') && <Mail className="w-4 h-4 text-blue-500" />}
        {methods.includes('sms') && <Smartphone className="w-4 h-4 text-green-500" />}
        {methods.includes('telegram') && <MessageSquare className="w-4 h-4 text-blue-400" />}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Signal Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage user signal subscriptions and notification preferences
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Subscription</DialogTitle>
              <DialogDescription>
                Add a signal subscription for a specific user
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubscription}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="user-select">User</Label>
                  <Select
                    value={newSubscription.userId}
                    onValueChange={(value) => 
                      setNewSubscription(prev => ({ ...prev, userId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ticker-timeframe">Ticker/Timeframe</Label>
                  <Select
                    value={`${newSubscription.tickerSymbol}-${newSubscription.timeframe}`}
                    onValueChange={(value) => {
                      const [tickerSymbol, timeframe] = value.split('-');
                      setNewSubscription(prev => ({ ...prev, tickerSymbol, timeframe }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ticker and timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {tickerTimeframes
                        .filter(combo => combo.isEnabled)
                        .map(combo => (
                          <SelectItem key={combo.id} value={`${combo.tickerSymbol}-${combo.timeframe}`}>
                            {combo.tickerSymbol} - {combo.timeframe}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notification Methods</Label>
                  <div className="space-y-2 mt-2">
                    {['email', 'sms', 'telegram'].map(method => (
                      <div key={method} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-${method}`}
                          checked={newSubscription.deliveryMethods.includes(method)}
                          onCheckedChange={(checked) => 
                            handleDeliveryMethodChange(method, checked as boolean)
                          }
                        />
                        <Label htmlFor={`new-${method}`} className="capitalize">
                          {method}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="max-alerts">Max Alerts Per Day</Label>
                  <Input
                    id="max-alerts"
                    type="number"
                    min="1"
                    max="100"
                    value={newSubscription.maxAlertsPerDay}
                    onChange={(e) => 
                      setNewSubscription(prev => ({ 
                        ...prev, 
                        maxAlertsPerDay: parseInt(e.target.value) || 50 
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? 'Creating...' : 'Create Subscription'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by user email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ticker-filter">Ticker Symbol</Label>
              <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                <SelectTrigger>
                  <SelectValue placeholder="All tickers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tickers</SelectItem>
                  {Array.from(new Set(tickerTimeframes.map(t => t.tickerSymbol))).map(ticker => (
                    <SelectItem key={ticker} value={ticker}>{ticker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeframe-filter">Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="All timeframes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All timeframes</SelectItem>
                  {Array.from(new Set(tickerTimeframes.map(t => t.timeframe))).map(timeframe => (
                    <SelectItem key={timeframe} value={timeframe}>{timeframe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{subscriptions.length}</div>
                <div className="text-sm text-muted-foreground">Total Subscriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {subscriptions.filter(s => s.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  {subscriptions.filter(s => !s.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Inactive</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(subscriptions.map(s => s.userId))).length}
                </div>
                <div className="text-sm text-muted-foreground">Unique Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>User Signal Subscriptions</CardTitle>
          <CardDescription>
            Manage all user signal subscriptions and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map(subscription => (
                <div 
                  key={subscription.id} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0"
                >
                  <div className="flex-1 space-y-1 sm:space-y-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(subscription.isActive)}
                      <span className="font-medium">
                        {subscription.userName} ({subscription.userEmail})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {subscription.tickerSymbol} - {subscription.timeframe}
                      </Badge>
                      <span>•</span>
                      <span>Max {subscription.maxAlertsPerDay} alerts/day</span>
                      <span>•</span>
                      {getDeliveryMethodIcons(subscription.deliveryMethods)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={showEditDialog && selectedSubscription?.id === subscription.id} onOpenChange={setShowEditDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSubscription(subscription)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Edit Subscription</DialogTitle>
                          <DialogDescription>
                            Update notification preferences for {subscription.userName}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedSubscription && (
                          <form onSubmit={handleUpdateSubscription}>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Subscription</Label>
                                <div className="p-3 border rounded bg-muted/50">
                                  {selectedSubscription.tickerSymbol} - {selectedSubscription.timeframe}
                                </div>
                              </div>

                              <div>
                                <Label>Notification Methods</Label>
                                <div className="space-y-2 mt-2">
                                  {['email', 'sms', 'telegram'].map(method => (
                                    <div key={method} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-${method}`}
                                        checked={selectedSubscription.deliveryMethods.includes(method)}
                                        onCheckedChange={(checked) => 
                                          handleDeliveryMethodChange(method, checked as boolean, true)
                                        }
                                      />
                                      <Label htmlFor={`edit-${method}`} className="capitalize">
                                        {method}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="edit-max-alerts">Max Alerts Per Day</Label>
                                <Input
                                  id="edit-max-alerts"
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={selectedSubscription.maxAlertsPerDay}
                                  onChange={(e) => 
                                    setSelectedSubscription({
                                      ...selectedSubscription,
                                      maxAlertsPerDay: parseInt(e.target.value) || 50
                                    })
                                  }
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit-active"
                                  checked={selectedSubscription.isActive}
                                  onCheckedChange={(checked) => 
                                    setSelectedSubscription({
                                      ...selectedSubscription,
                                      isActive: checked as boolean
                                    })
                                  }
                                />
                                <Label htmlFor="edit-active">Active</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                disabled={updateSubscriptionMutation.isPending}
                              >
                                {updateSubscriptionMutation.isPending ? 'Updating...' : 'Update Subscription'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this subscription for {subscription.userName}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSubscriptionMutation.mutate(subscription.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}