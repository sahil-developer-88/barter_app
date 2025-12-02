
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNavigate } from 'react-router-dom';
import { LogOut, LogIn, QrCode, Scan, Shield } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="mobile-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => navigate('/')}
            >
              Barter Network
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {user && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="hidden sm:flex border-green-200 text-green-700 hover:bg-green-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/merchant-dashboard')}
                className="hidden sm:flex"
              >
                Dashboard
              </Button>
            )}
            
            <Button
              variant={user ? "outline" : "default"}
              size="sm"
              onClick={handleAuthAction}
            >
              {user ? (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
