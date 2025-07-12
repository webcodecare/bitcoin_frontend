import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Smile,
  Frown,
  Meh,
  Heart,
  Star,
  Target,
  BarChart3,
  Calendar,
  Clock,
  Users
} from "lucide-react";

export default function MoodBoardSimple() {
  const { user } = useAuth();
  const [currentMood, setCurrentMood] = useState<string>("optimistic");

  const marketMoods = [
    { mood: "Bullish", icon: TrendingUp, color: "text-green-500", percentage: 68 },
    { mood: "Bearish", icon: TrendingDown, color: "text-red-500", percentage: 22 },
    { mood: "Neutral", icon: Activity, color: "text-yellow-500", percentage: 10 }
  ];

  const userMoods = [
    { mood: "Optimistic", icon: Smile, color: "text-green-500", count: 245 },
    { mood: "Cautious", icon: Meh, color: "text-yellow-500", count: 178 },
    { mood: "Concerned", icon: Frown, color: "text-red-500", count: 89 },
    { mood: "Excited", icon: Heart, color: "text-pink-500", count: 156 }
  ];

  const recentSentiments = [
    { user: "CryptoTrader", mood: "Bullish", message: "Bitcoin looking strong above $65k", time: "2 min ago" },
    { user: "MarketWatcher", mood: "Cautious", message: "Waiting for clear direction", time: "5 min ago" },
    { user: "InvestorPro", mood: "Optimistic", message: "Alt season might be starting", time: "8 min ago" },
    { user: "DayTrader", mood: "Neutral", message: "Sideways movement expected", time: "12 min ago" }
  ];

  const trendingTopics = [
    { topic: "Bitcoin ETF", sentiment: "positive", mentions: 1247 },
    { topic: "Ethereum Upgrade", sentiment: "positive", mentions: 892 },
    { topic: "Market Volatility", sentiment: "neutral", mentions: 654 },
    { topic: "Regulation News", sentiment: "negative", mentions: 423 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Activity className="h-5 w-5 md:h-6 md:w-6" />
                <h1 className="text-xl md:text-2xl font-bold">Market Mood Board</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400 text-xs md:text-sm self-start sm:self-auto">
                Community Sentiment
              </Badge>
            </div>
          </header>

          {/* Mood Board Content */}
          <div className="p-4 md:p-6">
            <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="market">Market Mood</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Current Market Sentiment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {marketMoods.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{item.mood}</CardTitle>
                            <IconComponent className={`h-6 w-6 ${item.color}`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-3xl font-bold">{item.percentage}%</div>
                            <Progress value={item.percentage} className="h-2" />
                            <div className="text-sm text-muted-foreground">
                              of traders feel {item.mood.toLowerCase()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Your Mood */}
                <Card>
                  <CardHeader>
                    <CardTitle>How are you feeling about the market today?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {userMoods.map((mood, index) => {
                        const IconComponent = mood.icon;
                        return (
                          <Button
                            key={index}
                            variant={currentMood === mood.mood.toLowerCase() ? "default" : "outline"}
                            className="h-20 flex-col space-y-2"
                            onClick={() => setCurrentMood(mood.mood.toLowerCase())}
                          >
                            <IconComponent className={`h-6 w-6 ${mood.color}`} />
                            <span className="text-sm">{mood.mood}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Community Sentiment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Community Sentiment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSentiments.map((sentiment, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-muted rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{sentiment.user}</span>
                              <Badge variant="outline" className="text-xs">
                                {sentiment.mood}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{sentiment.message}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">{sentiment.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="market" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Market Sentiment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {marketMoods.map((mood, index) => {
                          const IconComponent = mood.icon;
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <IconComponent className={`h-5 w-5 ${mood.color}`} />
                                <span className="font-medium">{mood.mood}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress value={mood.percentage} className="w-20 h-2" />
                                <span className="text-sm font-medium">{mood.percentage}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Tracker</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-muted rounded flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">Sentiment chart will appear here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="community" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {userMoods.map((mood, index) => {
                    const IconComponent = mood.icon;
                    return (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{mood.mood}</CardTitle>
                            <IconComponent className={`h-5 w-5 ${mood.color}`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{mood.count}</div>
                          <div className="text-xs text-muted-foreground">traders</div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Community Feed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSentiments.concat(recentSentiments).map((sentiment, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-muted rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{sentiment.user}</span>
                              <Badge variant="outline" className="text-xs">
                                {sentiment.mood}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{sentiment.message}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">{sentiment.time}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trending Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trendingTopics.map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              topic.sentiment === 'positive' ? 'bg-green-500' :
                              topic.sentiment === 'negative' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`} />
                            <span className="font-medium">{topic.topic}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{topic.mentions}</div>
                            <div className="text-sm text-muted-foreground">mentions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-muted rounded flex items-center justify-center">
                      <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">Timeline chart will appear here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}