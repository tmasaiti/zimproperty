import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, Bell, LogOut, Home } from 'lucide-react';
import { Footer } from './footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getMainTabClass = (tabPath: string) => {
    return location === tabPath ? 'tab-active' : 'tab-inactive';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-primary-700 font-bold text-xl">ZimProperty</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-primary-700 font-medium">
                Home
              </Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-primary-700 font-medium">
                How it Works
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-primary-700 font-medium">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-700 font-medium">
                Contact
              </Link>
            </nav>
            
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Link href={`/${user.role}`} className="text-primary-700 hover:text-primary-800 font-medium">
                    Dashboard
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-2">
                        <User className="h-4 w-4 mr-1" />
                        {user.firstName}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => window.location.href = `/${user.role}`}>
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => window.location.href = '/profile'}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => window.location.href = '/notifications'}>
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Link href="/auth?mode=login" className="text-gray-700 hover:text-primary-700 font-medium">
                    Login
                  </Link>
                  <Link href="/auth?mode=register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Register
                  </Link>
                </>
              )}
            </div>
            
            <div className="md:hidden flex items-center">
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Home
              </Link>
              <Link href="/how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                How it Works
              </Link>
              <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Pricing
              </Link>
              <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Contact
              </Link>
              
              <div className="pt-4 border-t border-gray-200 flex flex-col space-y-3">
                {user ? (
                  <>
                    <Link href={`/${user.role}`} className="block w-full px-3 py-2 rounded-md text-center text-base font-medium text-primary-700 hover:text-primary-800 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-3 py-2 rounded-md text-center text-base font-medium text-red-600 hover:text-red-700 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth?mode=login" className="block w-full px-3 py-2 rounded-md text-center text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                      Login
                    </Link>
                    <Link href="/auth?mode=register" className="block w-full px-3 py-2 rounded-md text-center text-base font-medium text-white bg-primary-700 hover:bg-primary-800">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main tabs - show only when logged in */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="User type tabs">
              {user.role === 'seller' || user.role === 'admin' ? (
                <Link href="/seller" className={getMainTabClass('/seller')}>
                  For Sellers
                </Link>
              ) : (
                <span className="tab-inactive opacity-50 cursor-not-allowed">For Sellers</span>
              )}
              
              {user.role === 'agent' || user.role === 'admin' ? (
                <Link href="/agent" className={getMainTabClass('/agent')}>
                  For Agents
                </Link>
              ) : (
                <span className="tab-inactive opacity-50 cursor-not-allowed">For Agents</span>
              )}
              
              {user.role === 'admin' && (
                <Link href="/admin" className={getMainTabClass('/admin')}>
                  For Admins
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
