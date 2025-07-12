import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserSettings } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { authAPI, tokenStorage } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Bell, 
  Palette, 
  TrendingUp, 
  Shield, 
  Settings, 
  Globe,
  Clock,
  DollarSign,
  BarChart3,
  Lock,
  Code,
  Smartphone
} from "lucide-react";

type PreferenceFormData = Partial<UserSettings>;

const timezones = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", 
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", 
  "Asia/Shanghai", "Asia/Singapore", "Australia/Sydney"
];

const currencies = [
  "USD", "EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "CHF", "KRW", "INR"
];

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" }
];

export default function Preferences() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notifications");
  const token = tokenStorage.get();

  const { data: settings, isLoading, error } = useQuery<UserSettings>({
    queryKey: ["/api/user/settings", token],
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      const response = await fetch("/api/user/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!token,
    retry: 2,
    staleTime: 30000,
  });

  // Provide default values to avoid TypeScript errors
  const safeSettings: UserSettings = {
    id: "",
    userId: "",
    // Notification defaults
    notificationEmail: true,
    notificationSms: false,
    notificationPush: true,
    emailSignalAlerts: true,
    smsSignalAlerts: false,
    pushSignalAlerts: true,
    emailFrequency: "realtime" as const,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    weekendNotifications: true,
    // Display defaults
    theme: "dark" as const,
    language: "en",
    timezone: "UTC",
    currency: "USD",
    dateFormat: "MM/DD/YYYY" as const,
    timeFormat: "12h" as const,
    // Chart defaults
    defaultChartType: "candlestick" as const,
    defaultTimeframe: "15m" as const,
    chartTheme: "dark" as const,
    showVolume: true,
    showIndicators: true,
    autoRefreshCharts: true,
    chartRefreshInterval: 30,
    // Trading defaults
    defaultOrderType: "market" as const,
    confirmTrades: true,
    enablePaperTrading: true,
    paperTradingBalance: "10000.00",
    riskPercentage: "2.00",
    stopLossPercentage: "3.00",
    takeProfitPercentage: "6.00",
    // Dashboard defaults
    defaultDashboard: "overview" as const,
    showPriceAlerts: true,
    showRecentTrades: true,
    showPortfolioSummary: true,
    showMarketOverview: true,
    maxDashboardItems: 20,
    compactView: false,
    // Privacy defaults
    profileVisibility: "private" as const,
    shareTradeHistory: false,
    allowAnalytics: true,
    twoFactorEnabled: false,
    sessionTimeout: 1440,
    // Advanced defaults
    enableBetaFeatures: false,
    apiAccessEnabled: false,
    webhookUrl: null,
    customCssEnabled: false,
    customCss: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...settings
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: PreferenceFormData) => {
      if (!token) throw new Error("No authentication token");
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings", token] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleBulkUpdate = (updates: PreferenceFormData) => {
    updateSettingsMutation.mutate(updates);
  };

  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <div className="ml-64 flex-1">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-64"></div>
                <div className="h-4 bg-muted rounded w-96"></div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6" />
                <h1 className="text-2xl font-bold">User Preferences</h1>
              </div>
              <Badge variant="outline" className="text-blue-400">
                Customize Settings
              </Badge>
            </div>
          </header>

          {/* Preferences Content */}
          <div className="p-6 max-w-4xl">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Customize your trading experience and platform settings
              </p>
            </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trading</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how and when you receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alert Types */}
              <div className="space-y-4">
                <h4 className="font-semibold">Alert Types</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">General platform notifications</p>
                    </div>
                    <Switch
                      checked={safeSettings.notificationEmail}
                      onCheckedChange={(checked) => handleSettingChange("notificationEmail", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Critical alerts via SMS</p>
                    </div>
                    <Switch
                      checked={settings?.notificationSms || false}
                      onCheckedChange={(checked) => handleSettingChange("notificationSms", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings?.notificationPush || false}
                      onCheckedChange={(checked) => handleSettingChange("notificationPush", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signal Alerts */}
              <div className="space-y-4">
                <h4 className="font-semibold">Trading Signal Alerts</h4>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Signal Alerts</Label>
                      <p className="text-sm text-muted-foreground">Buy/sell signals via email</p>
                    </div>
                    <Switch
                      checked={settings?.emailSignalAlerts || false}
                      onCheckedChange={(checked) => handleSettingChange("emailSignalAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Signal Alerts</Label>
                      <p className="text-sm text-muted-foreground">Urgent signals via SMS</p>
                    </div>
                    <Switch
                      checked={settings?.smsSignalAlerts || false}
                      onCheckedChange={(checked) => handleSettingChange("smsSignalAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Signal Alerts</Label>
                      <p className="text-sm text-muted-foreground">Real-time signal notifications</p>
                    </div>
                    <Switch
                      checked={settings?.pushSignalAlerts || false}
                      onCheckedChange={(checked) => handleSettingChange("pushSignalAlerts", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Schedule */}
              <div className="space-y-4">
                <h4 className="font-semibold">Notification Schedule</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email Frequency</Label>
                    <Select
                      value={settings?.emailFrequency || "realtime"}
                      onValueChange={(value) => handleSettingChange("emailFrequency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekend Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts on weekends</p>
                    </div>
                    <Switch
                      checked={settings?.weekendNotifications || false}
                      onCheckedChange={(checked) => handleSettingChange("weekendNotifications", checked)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Quiet Hours Start</Label>
                    <Input
                      type="time"
                      value={settings?.quietHoursStart || "22:00"}
                      onChange={(e) => handleSettingChange("quietHoursStart", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Quiet Hours End</Label>
                    <Input
                      type="time"
                      value={settings?.quietHoursEnd || "08:00"}
                      onChange={(e) => handleSettingChange("quietHoursEnd", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance and layout of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <Select
                      value={settings?.theme || "dark"}
                      onValueChange={(value) => handleSettingChange("theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={settings?.language || "en"}
                      onValueChange={(value) => handleSettingChange("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Select
                      value={settings?.timezone || "UTC"}
                      onValueChange={(value) => handleSettingChange("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={settings?.currency || "USD"}
                      onValueChange={(value) => handleSettingChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date Format</Label>
                    <Select
                      value={settings?.dateFormat || "MM/DD/YYYY"}
                      onValueChange={(value) => handleSettingChange("dateFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time Format</Label>
                    <Select
                      value={settings?.timeFormat || "12h"}
                      onValueChange={(value) => handleSettingChange("timeFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chart Preferences
              </CardTitle>
              <CardDescription>
                Configure default chart settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Default Chart Type</Label>
                    <Select
                      value={settings?.defaultChartType || "candlestick"}
                      onValueChange={(value) => handleSettingChange("defaultChartType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candlestick">Candlestick</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="heikin_ashi">Heikin Ashi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Timeframe</Label>
                    <Select
                      value={settings?.defaultTimeframe || "15m"}
                      onValueChange={(value) => handleSettingChange("defaultTimeframe", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 Minute</SelectItem>
                        <SelectItem value="5m">5 Minutes</SelectItem>
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="1w">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chart Theme</Label>
                    <Select
                      value={settings?.chartTheme || "dark"}
                      onValueChange={(value) => handleSettingChange("chartTheme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Volume</Label>
                      <p className="text-sm text-muted-foreground">Display volume indicators</p>
                    </div>
                    <Switch
                      checked={settings?.showVolume || false}
                      onCheckedChange={(checked) => handleSettingChange("showVolume", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Indicators</Label>
                      <p className="text-sm text-muted-foreground">Display technical indicators</p>
                    </div>
                    <Switch
                      checked={settings?.showIndicators || false}
                      onCheckedChange={(checked) => handleSettingChange("showIndicators", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Refresh Charts</Label>
                      <p className="text-sm text-muted-foreground">Automatically update charts</p>
                    </div>
                    <Switch
                      checked={settings?.autoRefreshCharts || false}
                      onCheckedChange={(checked) => handleSettingChange("autoRefreshCharts", checked)}
                    />
                  </div>
                  <div>
                    <Label>Refresh Interval (seconds)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="300"
                      value={settings?.chartRefreshInterval || 30}
                      onChange={(e) => handleSettingChange("chartRefreshInterval", parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Preferences
              </CardTitle>
              <CardDescription>
                Configure trading defaults and risk management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Default Order Type</Label>
                    <Select
                      value={settings?.defaultOrderType || "market"}
                      onValueChange={(value) => handleSettingChange("defaultOrderType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit">Limit Order</SelectItem>
                        <SelectItem value="stop_loss">Stop Loss</SelectItem>
                        <SelectItem value="take_profit">Take Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Confirm Trades</Label>
                      <p className="text-sm text-muted-foreground">Show confirmation dialog</p>
                    </div>
                    <Switch
                      checked={settings?.confirmTrades || false}
                      onCheckedChange={(checked) => handleSettingChange("confirmTrades", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Paper Trading</Label>
                      <p className="text-sm text-muted-foreground">Practice with virtual funds</p>
                    </div>
                    <Switch
                      checked={settings?.enablePaperTrading || false}
                      onCheckedChange={(checked) => handleSettingChange("enablePaperTrading", checked)}
                    />
                  </div>
                  <div>
                    <Label>Paper Trading Balance ($)</Label>
                    <Input
                      type="number"
                      min="1000"
                      max="1000000"
                      value={settings?.paperTradingBalance || "10000"}
                      onChange={(e) => handleSettingChange("paperTradingBalance", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Risk Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={settings?.riskPercentage || "2.00"}
                      onChange={(e) => handleSettingChange("riskPercentage", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum risk per trade as percentage of portfolio
                    </p>
                  </div>
                  <div>
                    <Label>Stop Loss Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.1"
                      value={settings?.stopLossPercentage || "3.00"}
                      onChange={(e) => handleSettingChange("stopLossPercentage", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Take Profit Percentage (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      step="0.1"
                      value={settings?.takeProfitPercentage || "6.00"}
                      onChange={(e) => handleSettingChange("takeProfitPercentage", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Preferences
              </CardTitle>
              <CardDescription>
                Customize your dashboard layout and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Default Dashboard</Label>
                    <Select
                      value={settings?.defaultDashboard || "overview"}
                      onValueChange={(value) => handleSettingChange("defaultDashboard", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="portfolio">Portfolio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max Dashboard Items</Label>
                    <Input
                      type="number"
                      min="5"
                      max="50"
                      value={settings?.maxDashboardItems || 20}
                      onChange={(e) => handleSettingChange("maxDashboardItems", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compact View</Label>
                      <p className="text-sm text-muted-foreground">Dense layout for more content</p>
                    </div>
                    <Switch
                      checked={settings?.compactView || false}
                      onCheckedChange={(checked) => handleSettingChange("compactView", checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Price Alerts</Label>
                      <p className="text-sm text-muted-foreground">Display price alert widget</p>
                    </div>
                    <Switch
                      checked={settings?.showPriceAlerts || false}
                      onCheckedChange={(checked) => handleSettingChange("showPriceAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Recent Trades</Label>
                      <p className="text-sm text-muted-foreground">Display recent trades widget</p>
                    </div>
                    <Switch
                      checked={settings?.showRecentTrades || false}
                      onCheckedChange={(checked) => handleSettingChange("showRecentTrades", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Portfolio Summary</Label>
                      <p className="text-sm text-muted-foreground">Display portfolio overview</p>
                    </div>
                    <Switch
                      checked={settings?.showPortfolioSummary || false}
                      onCheckedChange={(checked) => handleSettingChange("showPortfolioSummary", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Market Overview</Label>
                      <p className="text-sm text-muted-foreground">Display market overview widget</p>
                    </div>
                    <Switch
                      checked={settings?.showMarketOverview || false}
                      onCheckedChange={(checked) => handleSettingChange("showMarketOverview", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy settings and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Profile Visibility</Label>
                    <Select
                      value={settings?.profileVisibility || "private"}
                      onValueChange={(value) => handleSettingChange("profileVisibility", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Trade History</Label>
                      <p className="text-sm text-muted-foreground">Allow others to view your trades</p>
                    </div>
                    <Switch
                      checked={settings?.shareTradeHistory || false}
                      onCheckedChange={(checked) => handleSettingChange("shareTradeHistory", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Analytics</Label>
                      <p className="text-sm text-muted-foreground">Help improve the platform</p>
                    </div>
                    <Switch
                      checked={settings?.allowAnalytics || false}
                      onCheckedChange={(checked) => handleSettingChange("allowAnalytics", checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Extra security for your account</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings?.twoFactorEnabled && (
                        <Badge variant="secondary">Enabled</Badge>
                      )}
                      <Switch
                        checked={settings?.twoFactorEnabled || false}
                        onCheckedChange={(checked) => handleSettingChange("twoFactorEnabled", checked)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      max="10080"
                      value={settings?.sessionTimeout || 1440}
                      onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto logout after inactivity (15 min - 7 days)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Advanced Features
              </CardTitle>
              <CardDescription>
                Developer tools and experimental features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Beta Features</Label>
                    <p className="text-sm text-muted-foreground">Access experimental functionality</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Beta</Badge>
                    <Switch
                      checked={settings?.enableBetaFeatures || false}
                      onCheckedChange={(checked) => handleSettingChange("enableBetaFeatures", checked)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>API Access</Label>
                    <p className="text-sm text-muted-foreground">Enable API key generation</p>
                  </div>
                  <Switch
                    checked={settings?.apiAccessEnabled || false}
                    onCheckedChange={(checked) => handleSettingChange("apiAccessEnabled", checked)}
                  />
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    type="url"
                    placeholder="https://your-webhook-endpoint.com"
                    value={settings?.webhookUrl || ""}
                    onChange={(e) => handleSettingChange("webhookUrl", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive trading signals via webhook
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Custom CSS</Label>
                    <p className="text-sm text-muted-foreground">Apply custom styling</p>
                  </div>
                  <Switch
                    checked={settings?.customCssEnabled || false}
                    onCheckedChange={(checked) => handleSettingChange("customCssEnabled", checked)}
                  />
                </div>
                {settings?.customCssEnabled && (
                  <div>
                    <Label>Custom CSS Code</Label>
                    <Textarea
                      className="font-mono text-sm"
                      placeholder="/* Your custom CSS */&#10;.my-custom-class {&#10;  color: #ff6b6b;&#10;}"
                      value={settings?.customCss || ""}
                      onChange={(e) => handleSettingChange("customCss", e.target.value)}
                      rows={8}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

            {/* Save All Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => toast({ title: "Settings Auto-saved", description: "All changes are saved automatically" })}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Auto-saved
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}