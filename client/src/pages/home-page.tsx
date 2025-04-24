import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Home, Building, MapPin, DollarSign, Star, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('seller');

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Connect Sellers with Agents in Zimbabwe</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              The premier marketplace for property listings and real estate leads
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/auth?mode=login" className="inline-block">
                  <Button size="lg" variant="outline" className="w-full bg-white text-primary-700 hover:bg-gray-100">
                    Log In
                  </Button>
                </Link>
                <Link href="/auth?mode=register" className="inline-block">
                  <Button size="lg" className="w-full bg-secondary-500 hover:bg-secondary-600 text-white">
                    Register Now
                  </Button>
                </Link>
              </div>
            )}
            {user && (
              <Link href={`/${user.role}`} className="inline-block">
                <Button size="lg" className="bg-secondary-500 hover:bg-secondary-600 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="User type tabs">
            <button 
              className={activeTab === 'seller' ? 'tab-active' : 'tab-inactive'} 
              onClick={() => setActiveTab('seller')}
            >
              For Sellers
            </button>
            <button 
              className={activeTab === 'agent' ? 'tab-active' : 'tab-inactive'} 
              onClick={() => setActiveTab('agent')}
            >
              For Agents
            </button>
          </nav>
        </div>
      </div>

      {/* Seller Content */}
      {activeTab === 'seller' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">List Your Property, Connect with Agents</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Submit your property details and get contacted by verified real estate agents in Zimbabwe within 24 hours.
            </p>
          </div>

          {/* How It Works */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works For Sellers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">1. Submit Your Property</h3>
                <p className="text-gray-600">Fill in details about your property including location, price, and photos.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2. Connect with Agents</h3>
                <p className="text-gray-600">Receive notifications when agents are interested in your property.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">3. Close the Deal</h3>
                <p className="text-gray-600">Work with your chosen agent to sell or rent your property successfully.</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-16 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rounded-lg">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">What Sellers Say About Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 flex">
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                  </div>
                </div>
                <p className="text-gray-600 mb-4">"I listed my house in Borrowdale and received calls from 3 agents the very next day. Sold within 2 weeks for a great price!"</p>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                      <span className="text-primary-700 font-medium text-lg">TM</span>
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Tendai Moyo</h3>
                    <p className="text-sm text-gray-500">Harare, Zimbabwe</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 flex">
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                    <Star className="fill-current h-5 w-5" />
                    <Star className="h-5 w-5 text-gray-300" />
                  </div>
                </div>
                <p className="text-gray-600 mb-4">"The platform was easy to use, and I appreciated being able to choose between multiple agents. Found a tenant for my commercial property in Bulawayo in just days."</p>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                      <span className="text-primary-700 font-medium text-lg">SC</span>
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Samuel Chikwanda</h3>
                    <p className="text-sm text-gray-500">Bulawayo, Zimbabwe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to list your property?</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Join hundreds of satisfied sellers who found their ideal agents through our platform.
            </p>
            <Link href={user ? "/seller" : "/auth?mode=register&role=seller"} className="inline-block">
              <Button size="lg" className="bg-primary-700 hover:bg-primary-800">
                {user ? "Submit Your Property" : "Register as a Seller"}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Agent Content */}
      {activeTab === 'agent' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Find Quality Leads, Grow Your Business</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access verified property listings and connect with sellers ready to work with agents.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Qualified Leads</h3>
                <p className="text-gray-600">Connect with motivated sellers who have specifically requested agent assistance.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Save Time</h3>
                <p className="text-gray-600">Stop cold calling. Focus only on leads that match your expertise and location.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Build Reputation</h3>
                <p className="text-gray-600">Receive ratings from sellers to build your online reputation and credibility.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Flexible Pricing</h3>
                <p className="text-gray-600">Choose between pay-per-lead or unlimited subscription models to fit your budget.</p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans Preview */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Agent Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 bg-primary-50 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Pay-Per-Lead</h3>
                  <p className="text-gray-600 mt-1">Perfect for agents testing the platform</p>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline text-gray-900">
                    <span className="text-2xl font-semibold">$</span>
                    <span className="text-4xl font-extrabold tracking-tight">10-30</span>
                    <span className="ml-1 text-xl font-semibold">/lead</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Price varies based on lead quality and property value</p>
                  <div className="mt-8">
                    <Link href={user ? "/agent" : "/auth?mode=register&role=agent"} className="w-full inline-block">
                      <Button variant="outline" className="w-full text-primary-700">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-primary-200">
                <div className="px-6 py-4 bg-primary-700 text-white">
                  <h3 className="text-xl font-semibold">Unlimited Subscription</h3>
                  <p className="text-primary-100 mt-1">Best value for active agents</p>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline text-gray-900">
                    <span className="text-2xl font-semibold">$</span>
                    <span className="text-4xl font-extrabold tracking-tight">100-200</span>
                    <span className="ml-1 text-xl font-semibold">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Price based on location and property types</p>
                  <div className="mt-8">
                    <Link href={user ? "/agent" : "/auth?mode=register&role=agent"} className="w-full inline-block">
                      <Button className="w-full bg-primary-700 hover:bg-primary-800">
                        Subscribe Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to grow your real estate business?</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our network of successful agents finding quality leads every day.
            </p>
            <Link href={user ? "/agent" : "/auth?mode=register&role=agent"} className="inline-block">
              <Button size="lg" className="bg-primary-700 hover:bg-primary-800">
                {user ? "Access Agent Dashboard" : "Register as an Agent"}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
