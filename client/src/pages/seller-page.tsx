import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PropertyForm from '@/components/seller/property-form';
import { Property } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Home, Building, Map, Clock, DollarSign, PlusCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const SellerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch seller's properties
  const {
    data: properties,
    isLoading,
    error
  } = useQuery<Property[]>({
    queryKey: ['/api/properties/my-listings'],
    enabled: !!user
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  // Handle form submission
  const propertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const res = await apiRequest('POST', '/api/properties', propertyData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Property submitted',
        description: 'Your property listing has been successfully submitted.',
      });
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/properties/my-listings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'residential':
        return <Home className="h-5 w-5 text-primary-600" />;
      case 'commercial':
        return <Building className="h-5 w-5 text-primary-600" />;
      case 'land':
        return <Map className="h-5 w-5 text-primary-600" />;
      case 'apartment':
        return <Building className="h-5 w-5 text-primary-600" />;
      default:
        return <Home className="h-5 w-5 text-primary-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)} 
          className="mt-4 md:mt-0 bg-primary-700 hover:bg-primary-800"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Submit New Property
        </Button>
      </div>

      {isFormOpen && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Property Listing Form</CardTitle>
              <CardDescription>Fill in your property details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyForm 
                onSubmit={(data) => propertyMutation.mutate(data)} 
                onCancel={() => setIsFormOpen(false)}
                isPending={propertyMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications 
            {notifications && notifications.length > 0 && (
              <span className="ml-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="listings">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <Card className="my-6">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-500 mb-4">
                  <AlertCircle className="mr-2" />
                  <h3 className="font-medium">Error loading your listings</h3>
                </div>
                <p>There was a problem fetching your property listings. Please try again later.</p>
              </CardContent>
            </Card>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{property.type.charAt(0).toUpperCase() + property.type.slice(1)} in {property.location}</CardTitle>
                        <CardDescription className="truncate">{property.address}</CardDescription>
                      </div>
                      <div>{getStatusBadge(property.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                      <span className="flex items-center">
                        {getPropertyIcon(property.type)}
                        <span className="ml-1">{property.type}</span>
                      </span>
                      {property.size && (
                        <span className="flex items-center">
                          <Map className="h-4 w-4 mr-1" />
                          {property.size} sqm
                        </span>
                      )}
                      <span className="font-medium text-primary-700 flex items-center">
                        <DollarSign className="h-4 w-4" />
                        {property.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{property.description}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Listed on {formatDate(property.createdAt)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 px-6">
                    <Button variant="outline" className="w-full text-primary-700">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="my-6">
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No properties listed yet</h3>
                <p className="text-gray-600 mb-6 text-center max-w-md">
                  You haven't submitted any property listings yet. Click the "Submit New Property" button to get started.
                </p>
                <Button onClick={() => setIsFormOpen(true)} className="bg-primary-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Submit Your First Property
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="notifications">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-4 mt-6">
              {notifications.map((notification: any) => (
                <Card key={notification.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-2">
                      <div className="mr-4 bg-primary-100 text-primary-700 p-2 rounded-full">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-gray-500">{formatDate(notification.createdAt)}</p>
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
            <Card className="my-6">
              <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600 text-center max-w-md">
                  You don't have any notifications yet. When agents show interest in your properties, you'll see updates here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerPage;
