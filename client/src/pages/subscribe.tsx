import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ plan, price }: { plan: string, price: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/agent?tab=payments',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "You are now subscribed!",
        });
        setLocation('/agent?tab=payments');
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <span className="font-medium">Selected Plan:</span>
          <span className="font-medium text-primary-700">{plan}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-medium">Price:</span>
          <span className="font-medium text-primary-700">${price.toFixed(2)}</span>
        </div>
      </div>
      
      <PaymentElement />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !stripe || !elements}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pay and Subscribe
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [plan, setPlan] = useState("");
  const [price, setPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Get URL search params to retrieve plan type and price
    const params = new URLSearchParams(window.location.search);
    const planType = params.get('plan');
    const planPrice = params.get('price');
    const planMonths = params.get('months');
    
    if (!planType || !planPrice || !planMonths) {
      setError("Missing plan information. Please select a plan first.");
      setIsLoading(false);
      return;
    }
    
    setPlan(planType === 'unlimited' ? 'Unlimited Subscription' : 'Pay-Per-Lead');
    setPrice(Number(planPrice));
    
    // Create subscription intent
    setIsLoading(true);
    apiRequest("POST", "/api/create-subscription", { 
      planType, 
      price: Number(planPrice),
      months: Number(planMonths)
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create subscription");
        }
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to initialize payment");
        setIsLoading(false);
        toast({
          title: "Subscription Error",
          description: err.message || "Failed to initialize payment",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>We encountered a problem setting up your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation('/agent?tab=subscription')}>
              Return to Plans
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
          <CardDescription>Enter your payment details to subscribe</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm plan={plan} price={price} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}