import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Edit, Trash2, Plus, Users, TrendingUp, DollarSign, Calendar } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planTier: string;
  planName: string;
  status: "active" | "cancelled" | "expired" | "pending";
  startDate: string;
  endDate: string;
  amount: number;
  stripeSubscriptionId?: string;
  lastPayment: string;
  nextPayment: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  features: string[];
  maxSignals: number | null;
  maxTickers: number | null;
  isActive: boolean;
}

export default function AdminSubscriptions() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    tier: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [""],
    maxSignals: 0,
    maxTickers: 0,
  });
  const { toast } = useToast();

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<UserSubscription[]>({
    queryKey: ["/api/admin/subscriptions"],
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      const response = await apiRequest("POST", "/api/admin/subscription-plans", planData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      setIsCreateDialogOpen(false);
      setNewPlan({
        name: "",
        tier: "",
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [""],
        maxSignals: 0,
        maxTickers: 0,
      });
      toast({
        title: "Plan Created",
        description: "Subscription plan created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/subscription-plans/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      toast({
        title: "Plan Updated",
        description: "Subscription plan updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/subscription-plans/${planId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      toast({
        title: "Plan Deleted",
        description: "Subscription plan deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest("POST", `/api/admin/subscriptions/${subscriptionId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      toast({
        title: "Subscription Cancelled",
        description: "User subscription has been cancelled.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePlan = () => {
    if (!selectedPlan) return;
    
    const planData = {
      ...selectedPlan,
      features: selectedPlan.features.filter(f => f.trim()),
      monthlyPrice: selectedPlan.monthlyPrice,
      yearlyPrice: selectedPlan.yearlyPrice,
      maxSignals: selectedPlan.maxSignals === 0 ? -1 : selectedPlan.maxSignals,
      maxTickers: selectedPlan.maxTickers === 0 ? -1 : selectedPlan.maxTickers,
    };
    updatePlanMutation.mutate({ id: selectedPlan.id, data: planData });
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
      deletePlanMutation.mutate(planId);
    }
  };

  const handleCreatePlan = () => {
    const planData = {
      ...newPlan,
      features: newPlan.features.filter(f => f.trim()),
      monthlyPrice: newPlan.monthlyPrice * 100, // Convert to cents
      yearlyPrice: newPlan.yearlyPrice ? newPlan.yearlyPrice * 100 : null,
      maxSignals: newPlan.maxSignals === 0 ? -1 : newPlan.maxSignals,
      maxTickers: newPlan.maxTickers === 0 ? -1 : newPlan.maxTickers,
    };
    createPlanMutation.mutate(planData);
  };

  const updateFeature = (index: number, value: string) => {
    const features = [...newPlan.features];
    features[index] = value;
    setNewPlan(prev => ({ ...prev, features }));
  };

  const addFeature = () => {
    setNewPlan(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const removeFeature = (index: number) => {
    const features = newPlan.features.filter((_, i) => i !== index);
    setNewPlan(prev => ({ ...prev, features }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Subscription Management" 
            subtitle="Manage subscription plans and user subscriptions"
          >
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="users">User Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Subscription Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plansLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              plans.map((plan) => (
                <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </CardTitle>
                        <CardDescription className="capitalize">{plan.tier} tier</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={deletePlanMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(plan.monthlyPrice)}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                        {plan.yearlyPrice && (
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(plan.yearlyPrice)} per year
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Features:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features?.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                          {plan.features && plan.features.length > 3 && (
                            <li className="text-xs">+{plan.features.length - 3} more</li>
                          )}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="font-medium">Signals</p>
                          <p className="text-muted-foreground">
                            {plan.maxSignals === -1 ? "Unlimited" : plan.maxSignals}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Tickers</p>
                          <p className="text-muted-foreground">
                            {plan.maxTickers === -1 ? "Unlimited" : plan.maxTickers}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions</CardTitle>
              <CardDescription>Manage individual user subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active subscriptions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium">{subscription.userName}</h4>
                          <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{subscription.planName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(subscription.amount)} • Next payment: {new Date(subscription.nextPayment).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(subscription.status)}
                        {subscription.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                            disabled={cancelSubscriptionMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                    <p className="text-2xl font-bold">
                      {subscriptions.filter(s => s.status === "active").length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">$12,450</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                    <p className="text-2xl font-bold">2.3%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">-0.5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg LTV</p>
                    <p className="text-2xl font-bold">$287</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+8% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

            {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the details of this subscription plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={selectedPlan?.name || ""}
                onChange={(e) => setSelectedPlan(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Basic Plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tier">Tier</Label>
              <Select 
                value={selectedPlan?.tier || ""} 
                onValueChange={(value) => setSelectedPlan(prev => prev ? { ...prev, tier: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-monthly-price">Monthly Price ($)</Label>
              <Input
                id="edit-monthly-price"
                type="number"
                value={selectedPlan?.monthlyPrice ? selectedPlan.monthlyPrice / 100 : 0}
                onChange={(e) => setSelectedPlan(prev => prev ? { ...prev, monthlyPrice: Number(e.target.value) * 100 } : null)}
                placeholder="29.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-yearly-price">Yearly Price ($, optional)</Label>
              <Input
                id="edit-yearly-price"
                type="number"
                value={selectedPlan?.yearlyPrice ? selectedPlan.yearlyPrice / 100 : 0}
                onChange={(e) => setSelectedPlan(prev => prev ? { ...prev, yearlyPrice: Number(e.target.value) * 100 } : null)}
                placeholder="299.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max-signals">Max Signals (0 = unlimited)</Label>
              <Input
                id="edit-max-signals"
                type="number"
                value={selectedPlan?.maxSignals === -1 ? 0 : selectedPlan?.maxSignals || 0}
                onChange={(e) => setSelectedPlan(prev => prev ? { ...prev, maxSignals: Number(e.target.value) } : null)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max-tickers">Max Tickers (0 = unlimited)</Label>
              <Input
                id="edit-max-tickers"
                type="number"
                value={selectedPlan?.maxTickers === -1 ? 0 : selectedPlan?.maxTickers || 0}
                onChange={(e) => setSelectedPlan(prev => prev ? { ...prev, maxTickers: Number(e.target.value) } : null)}
                placeholder="10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            {selectedPlan?.features?.map((feature, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  value={feature}
                  onChange={(e) => {
                    if (selectedPlan) {
                      const newFeatures = [...selectedPlan.features];
                      newFeatures[index] = e.target.value;
                      setSelectedPlan({ ...selectedPlan, features: newFeatures });
                    }
                  }}
                  placeholder="Feature description"
                />
                {selectedPlan.features.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (selectedPlan) {
                        const newFeatures = selectedPlan.features.filter((_, i) => i !== index);
                        setSelectedPlan({ ...selectedPlan, features: newFeatures });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (selectedPlan) {
                  setSelectedPlan({ ...selectedPlan, features: [...selectedPlan.features, ""] });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={updatePlanMutation.isPending}>
              {updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan to your platform</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Pro Plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-tier">Tier</Label>
              <Select value={newPlan.tier} onValueChange={(value) => setNewPlan(prev => ({ ...prev, tier: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-price">Monthly Price ($)</Label>
              <Input
                id="monthly-price"
                type="number"
                value={newPlan.monthlyPrice}
                onChange={(e) => setNewPlan(prev => ({ ...prev, monthlyPrice: Number(e.target.value) }))}
                placeholder="29.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearly-price">Yearly Price ($)</Label>
              <Input
                id="yearly-price"
                type="number"
                value={newPlan.yearlyPrice}
                onChange={(e) => setNewPlan(prev => ({ ...prev, yearlyPrice: Number(e.target.value) }))}
                placeholder="299.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-signals">Max Signals (0 = unlimited)</Label>
              <Input
                id="max-signals"
                type="number"
                value={newPlan.maxSignals}
                onChange={(e) => setNewPlan(prev => ({ ...prev, maxSignals: Number(e.target.value) }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-tickers">Max Tickers (0 = unlimited)</Label>
              <Input
                id="max-tickers"
                type="number"
                value={newPlan.maxTickers}
                onChange={(e) => setNewPlan(prev => ({ ...prev, maxTickers: Number(e.target.value) }))}
                placeholder="10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            {newPlan.features.map((feature, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="Feature description"
                />
                {newPlan.features.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeFeature(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFeature}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
              {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
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