
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";

const ReviewSystem = () => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      reviewer: "Sarah Johnson",
      rating: 5,
      comment: "Excellent service! Very professional and delivered exactly what was promised.",
      date: "Dec 10, 2024",
      service: "Logo Design"
    },
    {
      id: 2,
      reviewer: "Mike Chen", 
      rating: 4,
      comment: "Great work, delivered on time. Would recommend!",
      date: "Dec 8, 2024",
      service: "Website Development"
    }
  ]);

  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });

  const handleStarClick = (rating: number) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const submitReview = () => {
    if (newReview.rating === 0) return;
    
    const review = {
      id: reviews.length + 1,
      reviewer: "You",
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toLocaleDateString(),
      service: "Current Service"
    };
    
    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, comment: '' });
  };

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">{reviews.length} reviews</p>
            </div>
          </div>

          {/* Leave a Review */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Leave a Review</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= newReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience..."
                rows={3}
              />
              
              <Button 
                onClick={submitReview}
                disabled={newReview.rating === 0}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.reviewer}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{review.service}</span>
                    <span>•</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewSystem;
