import React from 'react';
import Header from './Header';
import CartDrawer from './cart/CartDrawer';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main>
        {children}
      </main>
      <CartDrawer />
    </div>
  );
};

export default Layout;
