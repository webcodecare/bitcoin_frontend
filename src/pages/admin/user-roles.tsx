import React, { useState, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AdminGuard, PermissionGuard } from "@/components/auth/PermissionGuard";
import LazyLoader from "@/components/common/LazyLoader";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Users, UserPlus, Edit, Trash2, Shield, Key, Settings, Search, Crown, UserCheck } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'superuser';
  subscriptionTier: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

function AdminUserRolesContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Fetch admin users
  const { data: adminUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users', { role: 'admin,superuser' }],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?roles=admin,superuser');
      if (!response.ok) throw new Error('Failed to fetch admin users');
      return response.json();
    }
  });

  // Fetch available roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ['/api/admin/roles'],
    queryFn: async () => {
      // Mock data for now - in real implementation, this would come from backend
      return [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system administration access',
          permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'admin.dashboard', 'signals.manage'],
          userCount: adminUsers.filter((u: AdminUser) => u.role === 'admin').length
        },
        {
          id: 'superuser',
          name: 'Super Administrator',
          description: 'Complete system control and access',
          permissions: ['*'], // All permissions
          userCount: adminUsers.filter((u: AdminUser) => u.role === 'superuser').length
        }
      ];
    }
  });

  // Create admin user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<AdminUser>) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Failed to create admin user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateUserOpen(false);
      toast({
        title: "Success",
        description: "Admin user created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    }
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    }
  });

  // Filter admin users based on search and role
  const filteredUsers = adminUsers.filter((user: AdminUser) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = (formData: FormData) => {
    const userData = {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      role: formData.get('role') as string,
      subscriptionTier: 'pro', // Admin users get pro tier
      isActive: true
    };
    createUserMutation.mutate(userData);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-72">
          <TopBar />
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin User Management</h1>
                <p className="text-muted-foreground">
                  Manage administrator accounts and role-based permissions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Role-Based Access
                </Badge>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active admin accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminUsers.filter((u: AdminUser) => u.role === 'admin').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Standard admin role
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminUsers.filter((u: AdminUser) => u.role === 'superuser').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full system access
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminUsers.filter((u: AdminUser) => u.isActive).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList>
                <TabsTrigger value="users">Admin Users</TabsTrigger>
                <TabsTrigger value="roles">Role Management</TabsTrigger>
                <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
              </TabsList>

              {/* Admin Users Tab */}
              <TabsContent value="users" className="space-y-4">
                {/* Filters and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search admin users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="superuser">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <PermissionGuard permission="users.create">
                    <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Admin User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Admin User</DialogTitle>
                          <DialogDescription>
                            Add a new administrator to the system with role-based permissions.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleCreateUser(new FormData(e.currentTarget));
                        }}>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input name="firstName" placeholder="John" required />
                              </div>
                              <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input name="lastName" placeholder="Doe" required />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input name="email" type="email" placeholder="admin@example.com" required />
                            </div>
                            <div>
                              <Label htmlFor="role">Role</Label>
                              <Select name="role" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                  <SelectItem value="superuser">Super Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={createUserMutation.isPending}>
                              {createUserMutation.isPending ? "Creating..." : "Create Admin User"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </PermissionGuard>
                </div>

                {/* Admin Users Table */}
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: AdminUser) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <PermissionGuard permission="users.manage_roles" fallback={
                              <Badge variant={user.role === 'superuser' ? 'default' : 'secondary'}>
                                {user.role === 'superuser' ? 'Super Admin' : 'Administrator'}
                              </Badge>
                            }>
                              <Select 
                                value={user.role} 
                                onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                  <SelectItem value="superuser">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </PermissionGuard>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PermissionGuard permission="users.edit">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                              
                              <PermissionGuard permission="users.manage_roles">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleToggleStatus(user.id, user.isActive)}
                                >
                                  {user.isActive ? 'Disable' : 'Enable'}
                                </Button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* Role Management Tab */}
              <TabsContent value="roles" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userRoles.map((role: UserRole) => (
                    <Card key={role.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {role.id === 'superuser' ? <Crown className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                            {role.name}
                          </CardTitle>
                          <Badge variant="outline">{role.userCount} users</Badge>
                        </div>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.includes('*') ? (
                              <Badge variant="default" className="text-xs">All Permissions</Badge>
                            ) : (
                              role.permissions.slice(0, 4).map((permission) => (
                                <Badge key={permission} variant="secondary" className="text-xs">
                                  {permission}
                                </Badge>
                              ))
                            )}
                            {role.permissions.length > 4 && !role.permissions.includes('*') && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Permission Matrix Tab */}
              <TabsContent value="permissions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Permission Matrix</CardTitle>
                    <CardDescription>
                      Compare permissions across different admin roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Detailed permission matrix coming soon...</p>
                      <p className="text-xs mt-2">This will show a comprehensive comparison of admin role permissions</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

export default function AdminUserRoles() {
  return (
    <LazyLoader>
      <AdminUserRolesContent />
    </LazyLoader>
  );
}