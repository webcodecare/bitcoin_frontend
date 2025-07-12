import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Target, Award, Crown, Medal, Bell, Briefcase, BarChart3, Gamepad, Bitcoin, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  iconType: string;
  iconColor: string;
  points: number;
  requirement: {
    type: string;
    target: number;
  };
  isActive: boolean;
  rarity: string;
  createdAt: string;
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalLogins: number;
  loginStreak: number;
  signalsReceived: number;
  alertsCreated: number;
  dashboardViews: number;
  chartViews: number;
  portfolioCount: number;
  practiceTradesCompleted: number;
  totalPoints: number;
  level: number;
}

export default function AchievementsPage() {
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
  });

  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery({
    queryKey: ['/api/user/achievements'],
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
  });

  // Merge achievements with user progress
  const mergedAchievements = achievements.map((achievement: Achievement) => {
    const userAchievement = userAchievements.find((ua: UserAchievement) => ua.achievementId === achievement.id);
    return {
      ...achievement,
      isUnlocked: userAchievement?.isUnlocked || false,
      unlockedAt: userAchievement?.unlockedAt,
      progress: userAchievement?.progress || 0,
    };
  });

  const getIconComponent = (iconType: string, color: string = "gold") => {
    const iconClass = `h-6 w-6 text-${color === 'gold' ? 'yellow' : color}-500`;
    
    switch (iconType) {
      case 'trophy':
        return <Trophy className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      case 'target':
        return <Target className={iconClass} />;
      case 'badge':
        return <Award className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      case 'medal':
        return <Medal className={iconClass} />;
      case 'bell':
        return <Bell className={iconClass} />;
      case 'briefcase':
        return <Briefcase className={iconClass} />;
      case 'chart':
        return <BarChart3 className={iconClass} />;
      case 'gamepad':
        return <Gamepad className={iconClass} />;
      case 'bitcoin':
        return <Bitcoin className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'uncommon': return 'bg-green-100 text-green-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategories = () => {
    const categories = [...new Set(mergedAchievements.map(a => a.category))];
    return ['all', ...categories];
  };

  const filterByCategory = (category: string) => {
    if (category === 'all') return mergedAchievements;
    return mergedAchievements.filter(a => a.category === category);
  };

  const unlockedCount = mergedAchievements.filter(a => a.isUnlocked).length;
  const totalPoints = userStats?.totalPoints || 0;
  const userLevel = userStats?.level || 1;

  if (achievementsLoading || userAchievementsLoading || statsLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Achievements</h1>
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-gray-200 rounded mb-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and unlock rewards</p>
          
          {/* User Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{unlockedCount}</div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{totalPoints}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">Level {userLevel}</div>
                <div className="text-sm text-muted-foreground">Current Level</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{achievements.length}</div>
                <div className="text-sm text-muted-foreground">Total Available</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Achievement Categories */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="milestone">Milestone</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="streak">Streak</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          {getCategories().map(category => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByCategory(category).map((achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      achievement.isUnlocked 
                        ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' 
                        : 'border-gray-200'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getIconComponent(achievement.iconType, achievement.iconColor)}
                          <div>
                            <CardTitle className="text-lg">{achievement.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {achievement.description}
                            </CardDescription>
                          </div>
                        </div>
                        {achievement.isUnlocked && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✓ Unlocked
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        <Badge variant="outline">
                          {achievement.points} pts
                        </Badge>
                        <Badge variant="outline">
                          {achievement.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <Progress 
                          value={achievement.progress} 
                          className={`h-2 ${
                            achievement.isUnlocked 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}
                        />
                        
                        {achievement.isUnlocked && achievement.unlockedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                        
                        {!achievement.isUnlocked && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Target: {achievement.requirement.target} {achievement.requirement.type.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                    
                    {achievement.isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}