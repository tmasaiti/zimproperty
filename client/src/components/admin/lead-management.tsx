import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, Eye, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LeadManagementProps {
  flaggedLeads: any[];
  loading: boolean;
  limitDisplay?: number;
  showViewAll?: () => void;
}

const LeadManagement: React.FC<LeadManagementProps> = ({
  flaggedLeads,
  loading,
  limitDisplay,
  showViewAll
}) => {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Approve lead mutation
  const approveMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const res = await apiRequest('PATCH', `/api/admin/leads/${leadId}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Lead approved',
        description: 'The lead has been approved and is now visible to agents.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/flagged-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove lead mutation
  const removeMutation = useMutation({
    mutationFn: async ({ leadId, reason }: { leadId: number; reason: string }) => {
      const res = await apiRequest('DELETE', `/api/admin/leads/${leadId}`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Lead removed',
        description: 'The lead has been removed from the platform.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/flagged-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setShowRemoveDialog(false);
      setAdminNote('');
      setSelectedLead(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Removal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (lead: any) => {
    approveMutation.mutate(lead.id);
  };

  const openRemoveDialog = (lead: any) => {
    setSelectedLead(lead);
    setShowRemoveDialog(true);
  };

  const handleRemove = () => {
    if (selectedLead) {
      removeMutation.mutate({
        leadId: selectedLead.id,
        reason: adminNote,
      });
    }
  };

  const openDetailsDialog = (lead: any) => {
    setSelectedLead(lead);
    setShowDetailsDialog(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get flag reason badge
  const getFlagReasonBadge = (reason: string) => {
    switch (reason) {
      case 'suspicious_pricing':
        return <Badge className="bg-red-100 text-red-800">Suspicious Pricing</Badge>;
      case 'duplicate_listing':
        return <Badge className="bg-red-100 text-red-800">Duplicate Listing</Badge>;
      case 'spam':
        return <Badge className="bg-red-100 text-red-800">Spam</Badge>;
      case 'inappropriate_content':
        return <Badge className="bg-red-100 text-red-800">Inappropriate Content</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">{reason}</Badge>;
    }
  };

  // Get property type icon
  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case 'residential':
        return 'Residential';
      case 'commercial':
        return 'Commercial';
      case 'land':
        return 'Land/Plot';
      case 'apartment':
        return 'Apartment';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Display limited number of leads if limitDisplay is set
  const displayLeads = limitDisplay ? flaggedLeads.slice(0, limitDisplay) : flaggedLeads;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (flaggedLeads.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No flagged leads</h3>
        <p className="text-gray-600">All leads have been reviewed and are in good standing.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2">Property</th>
              <th className="text-left py-3 px-2">Flag Reason</th>
              <th className="text-left py-3 px-2">Reporter</th>
              <th className="text-left py-3 px-2">Reported</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayLeads.map((lead) => (
              <tr key={lead.id} className="border-b">
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                      {lead.type === 'residential' ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-500">
                          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : lead.type === 'commercial' ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-500">
                          <path d="M4 2H20C20.5304 2 21.0391 2.21071 21.4142 2.58579C21.7893 2.96086 22 3.46957 22 4V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M9 22V16H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2 8H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : lead.type === 'land' ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-500">
                          <path d="M2 22L12 12L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 8C16 10.7614 13.7614 13 11 13C8.23858 13 6 10.7614 6 8C6 5.23858 8.23858 3 11 3C13.7614 3 16 5.23858 16 8Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-gray-500">
                          <path d="M5 19H19V8.93557C19 8.3347 18.6039 7.78534 18.0299 7.54562L12.5299 5.17229C12.1982 5.05962 11.8018 5.05962 11.4701 5.17229L5.97014 7.54562C5.3961 7.78534 5 8.3347 5 8.93557V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 19V13C15 12.4477 14.5523 12 14 12H10C9.44772 12 9 12.4477 9 13V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{getPropertyTypeText(lead.type)} in {lead.location}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(lead.price)}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  {getFlagReasonBadge(lead.flagReason)}
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-900">
                    {lead.flagSource === 'system' ? 'System Auto-flag' : lead.reporterName}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-500">{formatDate(lead.flaggedAt)}</div>
                </td>
                <td className="py-3 px-2">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(lead)}
                      disabled={approveMutation.isPending && approveMutation.variables === lead.id}
                    >
                      {approveMutation.isPending && approveMutation.variables === lead.id && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openRemoveDialog(lead)}
                      disabled={removeMutation.isPending && selectedLead?.id === lead.id}
                    >
                      {removeMutation.isPending && selectedLead?.id === lead.id && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      <Ban className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailsDialog(lead)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {limitDisplay && flaggedLeads.length > limitDisplay && showViewAll && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={showViewAll}>
            View All ({flaggedLeads.length}) Flagged Leads
          </Button>
        </div>
      )}

      {/* Lead details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the flagged property listing
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Property Type</h4>
                  <p>{getPropertyTypeText(selectedLead.type)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p>{selectedLead.location}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Price</h4>
                  <p>{formatCurrency(selectedLead.price)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Size</h4>
                  <p>{selectedLead.size} sqm</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Address</h4>
                <p>{selectedLead.address}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="text-sm">{selectedLead.description}</p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500">Flag Information</h4>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">{getFlagReasonBadge(selectedLead.flagReason)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Flagged on {formatDate(selectedLead.flaggedAt)} by {selectedLead.flagSource === 'system' ? 'System Auto-flag' : selectedLead.reporterName}
                    </p>
                  </div>
                </div>
                {selectedLead.flagNote && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                    <p className="italic">"{selectedLead.flagNote}"</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500">Seller Information</h4>
                <div className="mt-2">
                  <p className="text-sm font-medium">{selectedLead.sellerName}</p>
                  <p className="text-xs text-gray-500">{selectedLead.sellerEmail}</p>
                  <p className="text-xs text-gray-500">{selectedLead.sellerPhone}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleApprove(selectedLead);
                  }}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    openRemoveDialog(selectedLead);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove lead confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Flagged Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this lead? This action cannot be undone.
              Please provide a reason for removal:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for removal..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleRemove}
              disabled={!adminNote.trim() || removeMutation.isPending}
            >
              {removeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadManagement;
