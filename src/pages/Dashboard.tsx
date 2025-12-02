import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Pause, 
  Play, 
  MessageSquare, 
  Coins, 
  User,
  Star,
  Eye,
  Heart,
  FileText,
  Gift,
  QrCode,
  Package,
  CreditCard
} from "lucide-react";
import { Link } from 'react-router-dom';
import TaxReporting from '@/components/tax/TaxReporting';
import FavoritesList from '@/components/favorites/FavoritesList';
import OrderTracking from '@/components/orders/OrderTracking';
import ReviewSystem from '@/components/reviews/ReviewSystem';
import ReferralSystem from '@/components/referrals/ReferralSystem';
import QRCodeSystem from '@/components/qr/QRCodeSystem';
import MixedPayment from '@/components/payment/MixedPayment';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const userStats = {
    totalPoints: 850,
    activeListings: 3,
    completedTrades: 8,
    pendingRequests: 2
  };

  const myListings = [
    {
      id: 1,
      businessName: "Digital Marketing Solutions",
      category: "Marketing",
      status: "active",
      views: 45,
      inquiries: 7,
      createdAt: "Nov 15, 2024"
    },
    {
      id: 2,
      businessName: "SEO Consultation",
      category: "Marketing",
      status: "paused",
      views: 23,
      inquiries: 3,
      createdAt: "Nov 10, 2024"
    }
  ];

  const tradeRequests = [
    {
      id: 1,
      from: "Legal Advisory Group",
      service: "Contract Review",
      message: "I'd like to trade legal services for your digital marketing package",
      status: "pending",
      receivedAt: "2 hours ago"
    },
    {
      id: 2,
      from: "Creative Design Studio",
      service: "Logo Design",
      message: "Would love to trade logo design for social media management",
      status: "pending",
      receivedAt: "1 day ago"
    }
  ];

  const recommendedMatches = [
    {
      id: 1,
      businessName: "Professional Photography",
      category: "Creative",
      match: "95%",
      reason: "Looking for marketing services"
    },
    {
      id: 2,
      businessName: "Accounting Services",
      category: "Finance",
      match: "87%",
      reason: "Needs digital marketing help"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "trade_completed",
      description: "Completed trade with Legal Advisory Group",
      points: "+120",
      timestamp: "2 days ago"
    },
    {
      id: 2,
      type: "listing_viewed",
      description: "Your listing was viewed 5 times",
      timestamp: "3 days ago"
    }
  ];

  const handleMixedPayment = (payment: { barterPoints: number; cashAmount: number }) => {
    console.log('Mixed payment submitted:', payment);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your trades.</p>
          </div>
          <Button asChild>
            <Link to="/onboarding">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="inbox">Inbox ({tradeRequests.length})</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="merchant">
              <CreditCard className="h-4 w-4 mr-1" />
              Merchant
            </TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Coins className="h-12 w-12 text-green-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{userStats.totalPoints}</h3>
                    <p className="text-gray-600">Barter Points</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Eye className="h-12 w-12 text-blue-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{userStats.activeListings}</h3>
                    <p className="text-gray-600">Active Listings</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Star className="h-12 w-12 text-purple-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{userStats.completedTrades}</h3>
                    <p className="text-gray-600">Completed Trades</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <MessageSquare className="h-12 w-12 text-orange-600 mr-4" />
                  <div>
                    <h3 className="text-2xl font-bold">{userStats.pendingRequests}</h3>
                    <p className="text-gray-600">Pending Requests</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                      {activity.points && (
                        <Badge variant="outline" className="text-green-600">
                          {activity.points}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions for New Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('merchant')}>
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <p className="text-sm font-medium">POS Integration</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('orders')}>
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Track Orders</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('referrals')}>
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Earn Referrals</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <QrCode className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm font-medium">QR Code</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Listings</CardTitle>
                  <CardDescription>Manage your service offerings</CardDescription>
                </div>
                <Button asChild>
                  <Link to="/onboarding">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Listing
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myListings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{listing.businessName}</h3>
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{listing.views} views</span>
                          <span>{listing.inquiries} inquiries</span>
                          <span>Created {listing.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          {listing.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbox" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade Requests</CardTitle>
                <CardDescription>Incoming trade proposals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tradeRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{request.from}</h3>
                          <p className="text-sm text-gray-600">Offering: {request.service}</p>
                          <p className="text-xs text-gray-500">{request.receivedAt}</p>
                        </div>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{request.message}</p>
                      <div className="flex gap-2">
                        <Button size="sm">Accept</Button>
                        <Button size="sm" variant="outline">Decline</Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Matches</CardTitle>
                <CardDescription>Businesses that might be interested in your services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium">{match.businessName}</h3>
                          <Badge variant="outline">{match.match} match</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{match.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button size="sm">Contact</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="merchant">
            <Card>
              <CardHeader>
                <CardTitle>Merchant POS Integration</CardTitle>
                <CardDescription>Connect your Point of Sale system for seamless transaction syncing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">Access Full Merchant Dashboard</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your POS system, view real-time transactions, and manage payment splits.
                  </p>
                  <Button asChild size="lg">
                    <Link to="/merchant-dashboard">
                      Go to Merchant Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <FavoritesList />
          </TabsContent>

          <TabsContent value="orders">
            <OrderTracking />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewSystem />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">John Doe</h3>
                        <p className="text-sm text-gray-600">john.doe@example.com</p>
                        <p className="text-sm text-gray-600">Member since November 2024</p>
                      </div>
                    </div>
                    <Button variant="outline">Edit Profile</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <TaxReporting />
                <QRCodeSystem />
              </div>
            </div>

            {/* Mixed Payment Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Options</CardTitle>
                <CardDescription>Configure your payment preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <MixedPayment 
                  totalAmount={500}
                  availablePoints={300}
                  onPaymentSubmit={handleMixedPayment}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
