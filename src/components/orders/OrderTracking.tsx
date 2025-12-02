
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Package, MessageSquare } from "lucide-react";

const OrderTracking = () => {
  const orders = [
    {
      id: "ORD-001",
      service: "Social Media Management Setup",
      provider: "Digital Marketing Solutions",
      status: "in-progress",
      progress: 60,
      estimatedCompletion: "Dec 20, 2024",
      lastUpdate: "2 hours ago"
    },
    {
      id: "ORD-002", 
      service: "Logo Design",
      provider: "Creative Design Studio",
      status: "completed",
      progress: 100,
      completedDate: "Dec 15, 2024",
      lastUpdate: "3 days ago"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Order Tracking</h2>
      
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(order.status)}
                  <h3 className="font-medium">{order.service}</h3>
                </div>
                <p className="text-sm text-gray-600">From: {order.provider}</p>
                <p className="text-xs text-gray-500">Order #{order.id}</p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('-', ' ')}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{order.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${order.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                {order.status === "completed" ? (
                  <span className="text-green-600">Completed on {order.completedDate}</span>
                ) : (
                  <span className="text-gray-600">Est. completion: {order.estimatedCompletion}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </Button>
                {order.status === "completed" && (
                  <Button size="sm">
                    Leave Review
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">Last update: {order.lastUpdate}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderTracking;
