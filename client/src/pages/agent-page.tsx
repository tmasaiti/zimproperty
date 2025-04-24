import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Property, LeadPurchase } from '@shared/schema';
import LeadCard from '@/components/agent/lead-card';
import SubscriptionPlans from '@/components/agent/subscription-plans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Home, Bell, AlertCircle, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';

const AgentPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    type: 'all',
    location: 'all',
    priceRange: 'all',
    status: 'all'
  });
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState('ecocash');

  // Check agent verification status
  const { data: agentStatus } = useQuery({
    queryKey: ['/api/user/agent-status'],
    enabled: user?.role === 'agent'
  });

  const isVerified = agentStatus?.status === 'approved';

  // Fetch agent profile with balance
  const { data: agentProfile } = useQuery({
    queryKey: ['/api/agent/profile'],
    enabled: !!user && user.role === 'agent' && isVerified
  });

  // Fetch available properties/leads
  const { 
    data: availableLeads,
    isLoading: leadsLoading 
  } = useQuery<Property[]>({
    queryKey: ['/api/properties', filters],
    enabled: !!user && user.role === 'agent' && isVerified
  });

  // Fetch purchased leads
  const { 
    data: purchasedLeads, 
    isLoading: purchasedLoadsLoading 
  } = useQuery<LeadPurchase[]>({
    queryKey: ['/api/leads/purchased'],
    enabled: !!user && user.role === 'agent' && isVerified
  });

  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscriptions/current'],
    enabled: !!user && user.role === 'agent' && isVerified
  });

  // Fetch payment history
  const { data: payments } = useQuery({
    queryKey: ['/api/payments/history'],
    enabled: !!user && user.role === 'agent' && isVerified
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  // Lead purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: { propertyId: number, price: number }) => {
      const res = await apiRequest('POST', '/api/leads/purchase', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Lead purchased',
        description: 'You have successfully purchased this lead.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/purchased'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Purchase failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Top up balance mutation
  const topUpMutation = useMutation({
    mutationFn: async (data: { amount: number, method: string }) => {
      const res = await apiRequest('POST', '/api/payments', {
        ...data,
        description: 'Account balance top-up'
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment successful',
        description: `$${topUpAmount} has been added to your account balance.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/history'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle lead purchase
  const handlePurchaseLead = (propertyId: number, price: number) => {
    purchaseMutation.mutate({ propertyId, price });
  };

  // Handle top up
  const handleTopUp = () => {
    topUpMutation.mutate({ amount: topUpAmount, method: paymentMethod });
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (user?.role === 'agent' && !isVerified) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Agent Verification Pending</CardTitle>
            <CardDescription>Your account is awaiting verification</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center pt-4">
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-full mb-6">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Thank you for registering as an agent!</h3>
            <p className="text-gray-600 mb-6 max-w-lg">
              Your account is currently under review by our administrators. This process typically takes 24 hours.
              You'll receive an email notification once your account has been verified.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg w-full max-w-md">
              <p className="text-sm text-gray-500 mb-1">Verification Status</p>
              <p className="text-lg font-medium text-yellow-600">Pending Review</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>
        {agentProfile && (
          <div className="mt-4 lg:mt-0 flex items-center bg-white shadow-sm rounded-lg p-3">
            <span className="text-gray-600 mr-2">Balance:</span>
            <span className="text-lg font-semibold text-primary-700">${agentProfile.balance.toFixed(2)}</span>
            <Button 
              size="sm" 
              className="ml-4 bg-secondary-500 hover:bg-secondary-600"
              onClick={() => document.getElementById('top-up-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Add Funds
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="available-leads">
        <TabsList className="mb-6">
          <TabsTrigger value="available-leads">Available Leads</TabsTrigger>
          <TabsTrigger value="my-leads">My Purchased Leads</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payments">Payments & Balance</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {notifications && notifications.length > 0 && (
              <span className="ml-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available-leads">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[180px]">
                  <Select 
                    value={filters.location} 
                    onValueChange={(value) => handleFilterChange('location', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="harare">Harare</SelectItem>
                      <SelectItem value="bulawayo">Bulawayo</SelectItem>
                      <SelectItem value="chitungwiza">Chitungwiza</SelectItem>
                      <SelectItem value="mutare">Mutare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Select 
                    value={filters.type} 
                    onValueChange={(value) => handleFilterChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land/Plot</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Select 
                    value={filters.priceRange} 
                    onValueChange={(value) => handleFilterChange('priceRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="0-50000">$0 - $50,000</SelectItem>
                      <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
                      <SelectItem value="100000-200000">$100,000 - $200,000</SelectItem>
                      <SelectItem value="200000+">$200,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Lead Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leads</SelectItem>
                      <SelectItem value="hot">Hot Leads (less than 24hrs)</SelectItem>
                      <SelectItem value="verified">Verified Sellers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {leadsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : availableLeads && availableLeads.length > 0 ? (
            <div className="space-y-6">
              {availableLeads.map((property) => (
                <LeadCard
                  key={property.id}
                  lead={property}
                  onPurchase={() => handlePurchaseLead(property.id, property.isVerified ? 30 : 20)}
                  isPending={purchaseMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No available leads</h3>
                <p className="text-gray-600 mb-6 text-center max-w-md">
                  There are no leads matching your current filters. Try adjusting your filters or check back later.
                </p>
                <Button onClick={() => setFilters({ type: 'all', location: 'all', priceRange: 'all', status: 'all' })}>
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-leads">
          {purchasedLoadsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : purchasedLeads && purchasedLeads.length > 0 ? (
            <div className="space-y-6">
              {purchasedLeads.map((leadPurchase) => (
                <Card key={leadPurchase.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-secondary-100 text-secondary-700">
                            <Home className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900">
                            {leadPurchase.property.type.charAt(0).toUpperCase() + leadPurchase.property.type.slice(1)} in {leadPurchase.property.location}
                          </h3>
                          <p className="text-sm text-gray-500">{leadPurchase.property.address}</p>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Badge className={leadPurchase.contacted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {leadPurchase.contacted ? "Contacted" : "Not Contacted"}
                            </Badge>
                            <span className="mx-2">•</span>
                            <span>Purchased on {format(new Date(leadPurchase.purchaseDate), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary-700">${leadPurchase.property.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Lead cost: ${leadPurchase.price}</p>
                        </div>
                        <Button className="bg-primary-700 hover:bg-primary-800">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No purchased leads yet</h3>
                <p className="text-gray-600 mb-6 text-center max-w-md">
                  You haven't purchased any leads yet. Browse the available leads tab to find properties that match your criteria.
                </p>
                <Button onClick={() => document.getElementById('available-leads')?.click()}>
                  Browse Available Leads
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionPlans currentSubscription={subscription} />
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payments && payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">Date</th>
                            <th className="text-left py-3 px-2">Description</th>
                            <th className="text-left py-3 px-2">Method</th>
                            <th className="text-left py-3 px-2">Amount</th>
                            <th className="text-left py-3 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment: any) => (
                            <tr key={payment.id} className="border-b">
                              <td className="py-3 px-2 text-sm">
                                {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                              </td>
                              <td className="py-3 px-2 text-sm">{payment.description}</td>
                              <td className="py-3 px-2 text-sm capitalize">{payment.method}</td>
                              <td className="py-3 px-2 text-sm font-medium">${payment.amount.toFixed(2)}</td>
                              <td className="py-3 px-2">
                                <Badge className={
                                  payment.status === 'completed' 
                                    ? "bg-green-100 text-green-800" 
                                    : payment.status === 'pending' 
                                    ? "bg-yellow-100 text-yellow-800" 
                                    : "bg-red-100 text-red-800"
                                }>
                                  {payment.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <ReceiptText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
                      <p className="text-gray-600 text-sm max-w-md mx-auto">
                        Your payment history will appear here once you've made transactions on the platform.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div id="top-up-section">
              <Card>
                <CardHeader>
                  <CardTitle>Top Up Balance</CardTitle>
                  <CardDescription>Add funds to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <Input
                          type="number"
                          className="pl-7"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(parseInt(e.target.value))}
                          min={10}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <Select 
                        value={paymentMethod} 
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ecocash">Ecocash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">USD Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="w-full bg-secondary-500 hover:bg-secondary-600 mt-2"
                      onClick={handleTopUp}
                      disabled={topUpMutation.isPending || topUpAmount < 10}
                    >
                      {topUpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CreditCard className="mr-2 h-4 w-4" />
                      Top Up Account
                    </Button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Payment Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center p-2 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 mr-3 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">Ecocash</p>
                          <p className="text-gray-500">Convenient mobile money transfers</p>
                        </div>
                      </div>
                      <div className="flex items-center p-2 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 mr-3 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-gray-500">Direct deposits to our bank account</p>
                        </div>
                      </div>
                      <div className="flex items-center p-2 border border-gray-200 rounded-lg">
                        <div className="w-8 h-8 mr-3 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">USD Cash</p>
                          <p className="text-gray-500">In-person payments at our office</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Card key={notification.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-2">
                      <div className="mr-4 bg-primary-100 text-primary-700 p-2 rounded-full">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-gray-500">{format(new Date(notification.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                      {!notification.read && (
                        <div className="ml-auto">
                          <Badge className="bg-blue-100 text-blue-800">New</Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 pl-12">{notification.message}</p>
                    {notification.linkUrl && (
                      <div className="pl-12 mt-2">
                        <Button variant="link" className="p-0 h-auto text-primary-700">
                          View Details
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600 text-center max-w-md">
                  You don't have any notifications yet. When new leads matching your criteria become available, you'll see updates here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentPage;
