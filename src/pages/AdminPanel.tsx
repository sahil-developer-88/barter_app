import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Star,
  CreditCard,
  DollarSign,
  Receipt,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useHasRole } from '@/hooks/useHasRole';
import { useAuth } from '@/hooks/useAuth';
// import { useAdminAccess } from '@/hooks/useAdminAccess';
import Form1099Dashboard from '@/components/tax/Form1099Dashboard';

const AdminPanel = () => {
  const { user } = useAuth();
  const { hasRole: isAdmin, loading, error } = useHasRole('admin');
  // const { isAdmin, loading, error } = useAdminAccess();
  const [activeTab, setActiveTab] = useState('overview');
  const [customCreditAmount, setCustomCreditAmount] = useState('');

  // Show loading state while checking admin access
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span>Verifying admin access...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if there was an issue checking admin access
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Error verifying admin access: {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if user is not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                You do not have admin privileges to access this page.
                {user ? ` Logged in as: ${user.email}` : ' Please log in with an admin account.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeListings: 342,
    completedTrades: 156,
    pendingApprovals: 23,
    totalCreditsIssued: 156000,
    availableCredits: 89500,
    total1099Required: 45,
    w9CompletionRate: 78
  };

  const pendingListings = [
    {
      id: 1,
      businessName: "Green Thumb Landscaping",
      owner: "Mike Johnson",
      category: "Home Services",
      status: "pending",
      submittedAt: "2 hours ago",
      email: "mike@greenthumb.com"
    },
    {
      id: 2,
      businessName: "Tech Repair Solutions",
      owner: "Sarah Chen",
      category: "Technology",
      status: "pending",
      submittedAt: "4 hours ago",
      email: "sarah@techrepair.com"
    }
  ];

  const creditHistory = [
    {
      id: 1,
      businessName: "Digital Marketing Solutions",
      amount: 500,
      type: "initial",
      timestamp: "1 hour ago"
    },
    {
      id: 2,
      businessName: "Photography Pro",
      amount: 1000,
      type: "manual",
      timestamp: "3 hours ago"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "listing_approved",
      description: "Digital Marketing Solutions approved by admin",
      timestamp: "1 hour ago"
    },
    {
      id: 2,
      type: "trade_completed",
      description: "Trade completed between Legal Advisory and Design Studio",
      timestamp: "3 hours ago"
    },
    {
      id: 3,
      type: "user_registered",
      description: "New user registered: Photography Pro",
      timestamp: "5 hours ago"
    }
  ];

  const handleApprove = (listingId: number) => {
    console.log('Approving listing:', listingId);
    // Issue $500 credit automatically
    const listing = pendingListings.find(l => l.id === listingId);
    if (listing) {
      console.log(`Issuing $500 credit to ${listing.businessName}`);
      // In real app, update Supabase and issue credit
    }
  };

  const handleReject = (listingId: number) => {
    console.log('Rejecting listing:', listingId);
    // In real app, update Supabase
  };

  const handleCustomCredit = (businessId: number) => {
    const amount = parseFloat(customCreditAmount);
    if (amount > 0) {
      console.log(`Issuing $${amount} credit to business ${businessId}`);
      setCustomCreditAmount('');
      // In real app, update Supabase
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">Manage your barter exchange platform</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Shield className="h-4 w-4 mr-1" />
              Admin Access Verified
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="tax-compliance">Tax & 1099</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Users className="h-12 w-12 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                    <p className="text-gray-600">Total Users</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <FileText className="h-12 w-12 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{stats.activeListings}</h3>
                    <p className="text-gray-600">Active Listings</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <TrendingUp className="h-12 w-12 text-purple-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{stats.completedTrades}</h3>
                    <p className="text-gray-600">Completed Trades</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Shield className="h-12 w-12 text-orange-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{stats.pendingApprovals}</h3>
                    <p className="text-gray-600">Pending Approvals</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <CreditCard className="h-12 w-12 text-indigo-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">${stats.totalCreditsIssued.toLocaleString()}</h3>
                    <p className="text-gray-600">Credits Issued</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <DollarSign className="h-12 w-12 text-emerald-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">${stats.availableCredits.toLocaleString()}</h3>
                    <p className="text-gray-600">Available Credits</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Receipt className="h-12 w-12 text-red-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{stats.total1099Required}</h3>
                    <p className="text-gray-600">1099s Required</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <FileText className="h-12 w-12 text-yellow-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{stats.w9CompletionRate}%</h3>
                    <p className="text-gray-600">W-9 Completion</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                      <Badge variant="outline">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Listings waiting for approval - $500 credit issued automatically upon approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingListings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{listing.businessName}</h3>
                        <p className="text-sm text-gray-600">by {listing.owner} • {listing.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{listing.category}</Badge>
                          <span className="text-xs text-gray-500">{listing.submittedAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(listing.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(listing.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve (+$500)
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit Management</CardTitle>
                <CardDescription>Manage merchant credits and line of credit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Credit Policy</h4>
                  <p className="text-sm text-blue-800">
                    • All approved merchants receive $500 initial credit
                    <br />• Credits can be used at any participating barter store
                    <br />• Additional credits can be issued manually below
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Issue Additional Credit</h4>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="customCredit">Credit Amount ($)</Label>
                      <Input
                        id="customCredit"
                        type="number"
                        placeholder="1000"
                        value={customCreditAmount}
                        onChange={(e) => setCustomCreditAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => handleCustomCredit(1)}>
                      Issue Credit
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Credit History</h4>
                  {creditHistory.map((credit) => (
                    <div key={credit.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{credit.businessName}</p>
                        <p className="text-sm text-gray-500">{credit.timestamp}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${credit.amount}</p>
                        <Badge variant={credit.type === 'initial' ? 'default' : 'secondary'}>
                          {credit.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax-compliance">
            <Form1099Dashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage platform users and their credit balances</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Detailed activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Activity logs coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
