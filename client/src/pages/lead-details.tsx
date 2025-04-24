import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Phone, Mail, MapPin, Home, Calendar, DollarSign, Check, Clock, AlertTriangle } from "lucide-react";
import { Property, LeadPurchase } from "@shared/schema";

export default function LeadDetailsPage() {
  const [, params] = useRoute("/lead/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const leadId = params?.id ? parseInt(params.id) : null;

  // Fetch lead details (property + purchase info)
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery<Property>({
    queryKey: ["/api/properties", leadId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!leadId,
  });

  const { data: leadPurchase, isLoading: leadLoading } = useQuery<LeadPurchase>({
    queryKey: ["/api/leads/purchased", leadId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!leadId,
  });

  // Mark lead as contacted mutation
  const contactMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/leads/${leadId}`, {
        contacted: true,
        status: "active"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead updated",
        description: "Lead has been marked as contacted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/purchased"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/purchased", leadId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Flag lead mutation
  const flagLeadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/leads/${leadId}/flag`, {
        reason: notes || "No reason provided"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead flagged",
        description: "Lead has been flagged for review by admin",
      });
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (propertyLoading || leadLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load lead details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">The lead you're looking for does not exist or you don't have permission to view it.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/agent")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isContacted = leadPurchase?.contacted;
  const leadStatus = leadPurchase?.status || "pending";

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setLocation("/agent")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={`${isContacted ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
              {isContacted ? "Contacted" : "Not Contacted"}
            </Badge>
            <Badge className={`
              ${leadStatus === "active" ? "bg-blue-100 text-blue-800" : ""}
              ${leadStatus === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
              ${leadStatus === "expired" ? "bg-red-100 text-red-800" : ""}
              ${leadStatus === "archived" ? "bg-gray-100 text-gray-800" : ""}
            `}>
              {leadStatus.charAt(0).toUpperCase() + leadStatus.slice(1)}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Property Details</TabsTrigger>
            <TabsTrigger value="contact">Seller Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{property.type.charAt(0).toUpperCase() + property.type.slice(1)} Property in {property.location}</CardTitle>
                <CardDescription>ID: #{property.id} • Added: {formatDate(property.createdAt)}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Property Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{property.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Home className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{property.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-medium">${property.price.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {property.size && (
                        <div className="flex items-center">
                          <div className="h-5 w-5 text-gray-500 mr-3 flex items-center justify-center">
                            <span className="text-xs font-bold">m²</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Size</p>
                            <p className="font-medium">{property.size} m²</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Posted on</p>
                          <p className="font-medium">{formatDate(property.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Lead Status</h3>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Purchase Date:</span>
                          <span className="font-medium">{formatDate(leadPurchase?.purchaseDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price Paid:</span>
                          <span className="font-medium">${leadPurchase?.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium capitalize">{leadStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contacted:</span>
                          <span className="font-medium">{isContacted ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      
                      {!isContacted && (
                        <Button
                          onClick={() => contactMutation.mutate()}
                          className="w-full mt-4"
                          disabled={contactMutation.isPending}
                        >
                          {contactMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Check className="mr-2 h-4 w-4" /> Mark as Contacted
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Description</h3>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="whitespace-pre-line">{property.description}</p>
                  </div>
                </div>
                
                {property.photos && property.photos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.photos.map((photo, index) => (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={photo} 
                            alt={`Property ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Report Issue</h3>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <Textarea
                      placeholder="If you encounter any issues with this lead, please describe the problem here."
                      className="mb-3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => flagLeadMutation.mutate()}
                      disabled={flagLeadMutation.isPending || !notes}
                    >
                      {flagLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <AlertTriangle className="mr-2 h-4 w-4" /> Flag This Lead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller Contact Information</CardTitle>
                <CardDescription>These details are available since you've purchased this lead</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                        <span className="font-medium text-green-700">
                          {property.seller?.firstName?.[0]}{property.seller?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">
                          {property.seller?.firstName} {property.seller?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">Property Owner</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">+263 {property.seller?.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{property.seller?.email}</p>
                        </div>
                      </div>
                      
                      {property.seller?.whatsappPreferred && (
                        <div className="mt-3 text-sm bg-yellow-50 text-yellow-800 p-2 rounded">
                          <span className="font-bold">Note:</span> This seller prefers to be contacted via WhatsApp.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <Button className="flex-1">
                      <Phone className="mr-2 h-4 w-4" /> Call Seller
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Mail className="mr-2 h-4 w-4" /> Email Seller
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium flex items-center text-blue-800">
                    <Clock className="h-5 w-5 mr-2" /> Follow-up Reminders
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Keeping in touch with leads increases your chances of closing a deal. Set a reminder to follow up with this seller.
                  </p>
                  <Button variant="outline" className="mt-4 bg-white">
                    Set Reminder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}