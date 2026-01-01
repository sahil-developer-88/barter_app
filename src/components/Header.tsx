
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHasRole } from "@/hooks/useHasRole";
import { useCart } from "@/contexts/CartContext";
// import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useNavigate } from 'react-router-dom';
import { LogOut, LogIn, Shield, ShoppingCart, User, Store } from 'lucide-react';

const Header = () => {
  const { user, signOut } = useAuth();
  const { hasRole: isAdmin } = useHasRole('admin');
  const { cartCount } = useCart();
  // const { isAdmin } = useAdminAccess();
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
            {user && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="hidden md:flex"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Stores
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="hidden md:flex"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>

                {cartCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/checkout')}
                    className="relative"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Cart</span>
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  </Button>
                )}

                {isAdmin && (
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
              </>
            )}

            <Button
              variant={user ? "outline" : "default"}
              size="sm"
              onClick={handleAuthAction}
            >
              {user ? (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
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
