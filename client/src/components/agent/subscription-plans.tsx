import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionPlansProps {
  currentSubscription?: any;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ currentSubscription }) => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<'pay_per_lead' | 'unlimited'>('unlimited');
  const [selectedPrice, setSelectedPrice] = useState<number>(100);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);

  // Calculate pricing
  const calculatePrice = (type: string, months: number) => {
    if (type === 'pay_per_lead') return 0; // Pay per lead doesn't have a subscription fee
    return months === 1 ? 100 : 200; // Monthly rate
  };

  // Create or update subscription mutation
  const subscriptionMutation = useMutation({
    mutationFn: async (data: { type: string; price: number; months: number }) => {
      const res = await apiRequest('POST', '/api/subscriptions', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription updated',
        description: 'Your subscription has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Subscription failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import useLocation for navigation
  const [, setLocation] = useLocation();

  // Handle subscription
  const handleSubscribe = () => {
    if (selectedType === 'pay_per_lead') {
      toast({
        description: 'Pay-per-lead option selected. You can now purchase leads individually.',
      });
      subscriptionMutation.mutate({
        type: selectedType,
        price: 0,
        months: 0,
      });
      return;
    }

    const price = calculatePrice(selectedType, selectedMonths);
    
    // Navigate to the subscription page with plan parameters
    setLocation(`/subscribe?plan=${selectedType}&price=${price}&months=${selectedMonths}`);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine if user has an active subscription
  const hasActiveSubscription = currentSubscription && currentSubscription.isActive;

  return (
    <div className="space-y-8">
      {hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {currentSubscription.type.replace('_', ' ')} Plan
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Valid until {formatDate(currentSubscription.endDate)}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly fee:</span>
                  <span className="font-medium">${currentSubscription.price}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Auto-renew:</span>
                  <span className="font-medium">{currentSubscription.autoRenew ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="mr-2">Cancel Subscription</Button>
            <Button>Change Plan</Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agent Subscription Plans</CardTitle>
          <CardDescription>Choose the plan that works best for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedType} 
            onValueChange={(value) => setSelectedType(value as 'pay_per_lead' | 'unlimited')}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pay_per_lead" id="pay_per_lead" />
                <Label htmlFor="pay_per_lead" className="text-lg font-semibold">Pay-Per-Lead</Label>
              </div>
              <div className="ml-6 mt-2">
                <div className="flex items-baseline text-gray-900">
                  <span className="text-2xl font-semibold">$</span>
                  <span className="text-4xl font-extrabold tracking-tight">10-30</span>
                  <span className="ml-1 text-xl font-semibold">/lead</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Price varies based on lead quality and property value</p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">No monthly commitment</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Pay only for leads you're interested in</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Standard lead support</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Access to lead contact details</p>
                  </li>
                </ul>
              </div>
            </div>

            <div className={`relative ${selectedType === 'unlimited' ? 'border-2 border-primary-500 rounded-lg p-4' : 'p-4'}`}>
              {selectedType === 'unlimited' && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">Best Value</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unlimited" id="unlimited" />
                <Label htmlFor="unlimited" className="text-lg font-semibold">Unlimited Subscription</Label>
              </div>
              <div className="ml-6 mt-2">
                <Tabs defaultValue="monthly">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger 
                      value="monthly" 
                      onClick={() => {
                        setSelectedMonths(1);
                        setSelectedPrice(100);
                      }}
                    >
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger 
                      value="yearly" 
                      onClick={() => {
                        setSelectedMonths(12);
                        setSelectedPrice(200);
                      }}
                    >
                      Yearly (Save 20%)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="monthly">
                    <div className="flex items-baseline text-gray-900">
                      <span className="text-2xl font-semibold">$</span>
                      <span className="text-4xl font-extrabold tracking-tight">100</span>
                      <span className="ml-1 text-xl font-semibold">/month</span>
                    </div>
                  </TabsContent>
                  <TabsContent value="yearly">
                    <div className="flex items-baseline text-gray-900">
                      <span className="text-2xl font-semibold">$</span>
                      <span className="text-4xl font-extrabold tracking-tight">960</span>
                      <span className="ml-1 text-xl font-semibold">/year</span>
                    </div>
                    <p className="mt-1 text-sm text-green-600">You save $240 per year</p>
                  </TabsContent>
                </Tabs>
                <p className="mt-2 text-sm text-gray-500">Unlimited lead access for Harare and surrounding areas</p>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Unlimited lead purchases</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Priority access to new leads</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Premium lead support</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">Performance analytics dashboard</p>
                  </li>
                </ul>
              </div>
            </div>
          </RadioGroup>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between">
              <div className="text-lg font-medium">Your selection:</div>
              <div className="text-lg font-medium text-primary-700">
                {selectedType === 'pay_per_lead' 
                  ? 'Pay-Per-Lead (No subscription fee)' 
                  : `Unlimited ($${selectedPrice}/month)`
                }
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            className="bg-primary-700 hover:bg-primary-800"
            onClick={handleSubscribe}
            disabled={subscriptionMutation.isPending}
          >
            {subscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasActiveSubscription ? 'Update Subscription' : 'Subscribe Now'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Flexible payment options for Zimbabwean agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-gray-700">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7V11.5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ecocash</h3>
              <p className="text-gray-600">Convenient mobile money transfers</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-gray-700">
                  <path d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V10Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 15C13.1046 15 14 14.1046 14 13C14 11.8954 13.1046 11 12 11C10.8954 11 10 11.8954 10 13C10 14.1046 10.8954 15 12 15Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bank Transfer</h3>
              <p className="text-gray-600">Direct deposits to our bank account</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-gray-700">
                  <path d="M17 9V8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8V9M12 15V17M8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V13.8C20 12.1198 20 11.2798 19.673 10.638C19.3854 10.0735 18.9265 9.6146 18.362 9.32698C17.7202 9 16.8802 9 15.2 9H8.8C7.11984 9 6.27976 9 5.63803 9.32698C5.07354 9.6146 4.6146 10.0735 4.32698 10.638C4 11.2798 4 12.1198 4 13.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">USD Cash</h3>
              <p className="text-gray-600">In-person payments at our office</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlans;
