
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Gift, Users } from "lucide-react";

const ReferralSystem = () => {
  const [referralCode] = useState("JOHN2024");
  const [emailInvite, setEmailInvite] = useState("");
  
  const referralStats = {
    totalReferrals: 8,
    pendingRewards: 150,
    totalEarned: 400,
    conversionRate: "65%"
  };

  const recentReferrals = [
    { name: "Sarah M.", status: "completed", reward: 50, date: "Dec 15" },
    { name: "Mike K.", status: "pending", reward: 50, date: "Dec 12" },
    { name: "Lisa R.", status: "completed", reward: 50, date: "Dec 10" }
  ];

  const copyReferralLink = () => {
    const link = `https://yourapp.com/join?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    // Show toast notification in real app
    console.log('Referral link copied!');
  };

  const sendEmailInvite = () => {
    if (!emailInvite) return;
    // Send email invite logic here
    console.log('Email invite sent to:', emailInvite);
    setEmailInvite("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Earn $50 for each successful referral!</h3>
            <p className="text-sm text-gray-600">
              Share your referral code and earn barter points when friends join and make their first trade.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{referralStats.totalReferrals}</div>
              <div className="text-sm text-gray-600">Total Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${referralStats.totalEarned}</div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${referralStats.pendingRewards}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{referralStats.conversionRate}</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex gap-2 mt-1">
                <Input value={referralCode} readOnly />
                <Button onClick={copyReferralLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Invite by Email</label>
              <div className="flex gap-2 mt-1">
                <Input 
                  value={emailInvite}
                  onChange={(e) => setEmailInvite(e.target.value)}
                  placeholder="friend@example.com"
                />
                <Button onClick={sendEmailInvite}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{referral.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{referral.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">${referral.reward}</span>
                  <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                    {referral.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;
