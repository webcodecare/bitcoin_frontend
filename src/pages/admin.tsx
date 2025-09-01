import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch as UISwitch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  Activity, 
  DollarSign, 
  Server, 
  Plus, 
  Edit, 
  Trash2,
  Send,
  CheckCircle,
  XCircle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
}

interface SignalForm {
  ticker: string;
  signalType: "buy" | "sell";
  price: number;
  note: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signalForm, setSignalForm] = useState<SignalForm>({
    ticker: "",
    signalType: "buy",
    price: 0,
    note: "",
  });
  const [newTicker, setNewTicker] = useState({
    symbol: "",
    description: "",
    isEnabled: true,
  });
  const [isSignalDialogOpen, setIsSignalDialogOpen] = useState(false);
  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);

  const authToken = localStorage.getItem("auth_token");

  // Fetch admin stats
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json() as User[];
    },
  });

  const { data: tickers, isLoading: isLoadingTickers } = useQuery({
    queryKey: ["/api/admin/tickers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tickers", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tickers");
      return await response.json() as Ticker[];
    },
  });

  const { data: signals, isLoading: isLoadingSignals } = useQuery({
    queryKey: ["/api/signals"],
    queryFn: async () => {
      const response = await fetch("/api/signals?limit=20", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch signals");
      return await response.json();
    },
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const createTickerMutation = useMutation({
    mutationFn: async (ticker: typeof newTicker) => {
      const response = await fetch("/api/admin/tickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(ticker),
      });
      if (!response.ok) throw new Error("Failed to create ticker");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickers"] });
      setNewTicker({ symbol: "", description: "", isEnabled: true });
      setIsTickerDialogOpen(false);
      toast({ title: "Ticker created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create ticker", variant: "destructive" });
    },
  });

  const updateTickerMutation = useMutation({
    mutationFn: async ({ tickerId, updates }: { tickerId: string; updates: Partial<Ticker> }) => {
      const response = await fetch(`/api/admin/tickers/${tickerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update ticker");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickers"] });
      toast({ title: "Ticker updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update ticker", variant: "destructive" });
    },
  });

  const createSignalMutation = useMutation({
    mutationFn: async (signal: SignalForm) => {
      const response = await fetch("/api/admin/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(signal),
      });
      if (!response.ok) throw new Error("Failed to create signal");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signals"] });
      setSignalForm({ ticker: "", signalType: "buy", price: 0, note: "" });
      setIsSignalDialogOpen(false);
      toast({ title: "Signal injected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to inject signal", variant: "destructive" });
    },
  });

  const adminStats = [
    {
      title: "Total Users",
      value: users?.length.toString() || "0",
      icon: Users,
      color: "text-foreground",
    },
    {
      title: "Active Signals",
      value: signals?.length.toString() || "0",
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      title: "Revenue",
      value: "$45,678",
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      title: "System Status",
      value: "Online",
      icon: Server,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Last login: 2h ago</span>
                <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground font-semibold">
                  A
                </div>
              </div>
            </div>
          </header>

          {/* Admin Content */}
          <div className="p-6 space-y-6">
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {adminStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                        <IconComponent className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <UISwitch
                                checked={user.isActive}
                                onCheckedChange={(checked: boolean) =>
                                  updateUserMutation.mutate({
                                    userId: user.id,
                                    updates: { isActive: checked },
                                  })
                                }
                              />
                              <span className="text-sm">
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateUserMutation.mutate({
                                  userId: user.id,
                                  updates: { role: user.role === 'admin' ? 'user' : 'admin' },
                                })
                              }
                            >
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Ticker Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Manage Available Tickers</CardTitle>
                  <Dialog open={isTickerDialogOpen} onOpenChange={setIsTickerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Ticker
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Ticker</DialogTitle>
                        <DialogDescription>
                          Add a new cryptocurrency ticker to the platform.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="symbol">Symbol</Label>
                          <Input
                            id="symbol"
                            placeholder="BTCUSDT"
                            value={newTicker.symbol}
                            onChange={(e) => setNewTicker({ ...newTicker, symbol: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            placeholder="Bitcoin/USDT"
                            value={newTicker.description}
                            onChange={(e) => setNewTicker({ ...newTicker, description: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <UISwitch
                            checked={newTicker.isEnabled}
                            onCheckedChange={(checked: boolean) => setNewTicker({ ...newTicker, isEnabled: checked })}
                          />
                          <Label>Enabled</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => createTickerMutation.mutate(newTicker)}
                          disabled={createTickerMutation.isPending}
                        >
                          {createTickerMutation.isPending ? "Creating..." : "Create Ticker"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTickers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickers?.map((ticker) => (
                        <TableRow key={ticker.id}>
                          <TableCell className="font-semibold">{ticker.symbol}</TableCell>
                          <TableCell className="text-muted-foreground">{ticker.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <UISwitch
                                checked={ticker.isEnabled}
                                onCheckedChange={(checked: boolean) =>
                                  updateTickerMutation.mutate({
                                    tickerId: ticker.id,
                                    updates: { isEnabled: checked },
                                  })
                                }
                              />
                              {ticker.isEnabled ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Manual Signal Injection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Manual Signal Injection</CardTitle>
                  <Dialog open={isSignalDialogOpen} onOpenChange={setIsSignalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Send className="mr-2 h-4 w-4" />
                        Inject Signal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inject Manual Signal</DialogTitle>
                        <DialogDescription>
                          Manually inject a buy/sell signal for testing or premium users.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ticker">Ticker</Label>
                          <Select
                            value={signalForm.ticker}
                            onValueChange={(value) => setSignalForm({ ...signalForm, ticker: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ticker" />
                            </SelectTrigger>
                            <SelectContent>
                              {tickers?.filter(t => t.isEnabled).map((ticker) => (
                                <SelectItem key={ticker.id} value={ticker.symbol}>
                                  {ticker.symbol} - {ticker.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="signalType">Signal Type</Label>
                          <Select
                            value={signalForm.signalType}
                            onValueChange={(value: "buy" | "sell") => setSignalForm({ ...signalForm, signalType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">Buy</SelectItem>
                              <SelectItem value="sell">Sell</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="67234.56"
                            value={signalForm.price || ""}
                            onChange={(e) => setSignalForm({ ...signalForm, price: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="note">Note (Optional)</Label>
                          <Input
                            id="note"
                            placeholder="Manual signal for testing"
                            value={signalForm.note}
                            onChange={(e) => setSignalForm({ ...signalForm, note: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={() => createSignalMutation.mutate(signalForm)}
                          disabled={createSignalMutation.isPending}
                        >
                          {createSignalMutation.isPending ? "Injecting..." : "Inject Signal"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use the button above to manually inject trading signals. This will broadcast to all connected users and trigger their configured alerts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
