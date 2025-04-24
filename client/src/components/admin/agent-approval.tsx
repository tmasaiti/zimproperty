import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

interface AgentApprovalProps {
  pendingAgents: any[];
  loading: boolean;
  limitDisplay?: number;
  showViewAll?: () => void;
}

const AgentApproval: React.FC<AgentApprovalProps> = ({ 
  pendingAgents, 
  loading, 
  limitDisplay,
  showViewAll 
}) => {
  const { toast } = useToast();
  const [reason, setReason] = React.useState('');
  const [selectedAgentId, setSelectedAgentId] = React.useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);

  // Approve or reject agent verification
  const verificationMutation = useMutation({
    mutationFn: async ({ agentId, status, note }: { agentId: number; status: string; note?: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/agent-verifications/${agentId}`, { status, note });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Agent updated',
        description: 'The agent verification status has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setShowRejectDialog(false);
      setReason('');
      setSelectedAgentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (agentId: number) => {
    verificationMutation.mutate({ agentId, status: 'approved' });
  };

  const openRejectDialog = (agentId: number) => {
    setSelectedAgentId(agentId);
    setShowRejectDialog(true);
  };

  const handleReject = () => {
    if (selectedAgentId !== null) {
      verificationMutation.mutate({ 
        agentId: selectedAgentId, 
        status: 'rejected',
        note: reason 
      });
    }
  };

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Display limited number of agents if limitDisplay is set
  const displayAgents = limitDisplay ? pendingAgents.slice(0, limitDisplay) : pendingAgents;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (pendingAgents.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No pending verifications</h3>
        <p className="text-gray-600">All agent registrations have been processed.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2">Agent</th>
              <th className="text-left py-3 px-2">Agency</th>
              <th className="text-left py-3 px-2">Submitted</th>
              <th className="text-left py-3 px-2">Documents</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayAgents.map((agent) => (
              <tr key={agent.userId} className="border-b">
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>
                        {getInitials(agent.user.firstName, agent.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{agent.user.firstName} {agent.user.lastName}</div>
                      <div className="text-sm text-gray-500">{agent.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="font-medium">{agent.agencyName}</div>
                </td>
                <td className="py-3 px-2">
                  <div className="text-sm text-gray-500">{formatDate(agent.user.createdAt)}</div>
                </td>
                <td className="py-3 px-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto">View Documents</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agent Documents</DialogTitle>
                        <DialogDescription>
                          License and verification documents for {agent.user.firstName} {agent.user.lastName}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="border rounded-md p-4 mt-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-gray-500" />
                          <div>
                            <p className="font-medium">{agent.licenseDocument}</p>
                            <p className="text-sm text-gray-500">License Document</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="py-3 px-2">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </td>
                <td className="py-3 px-2">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(agent.userId)}
                      disabled={verificationMutation.isPending}
                    >
                      {verificationMutation.isPending && verificationMutation.variables?.agentId === agent.userId && 
                        verificationMutation.variables?.status === 'approved' && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openRejectDialog(agent.userId)}
                      disabled={verificationMutation.isPending}
                    >
                      {verificationMutation.isPending && verificationMutation.variables?.agentId === agent.userId && 
                        verificationMutation.variables?.status === 'rejected' && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {limitDisplay && pendingAgents.length > limitDisplay && showViewAll && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={showViewAll}>
            View All ({pendingAgents.length}) Pending Agents
          </Button>
        </div>
      )}

      {/* Rejection reason dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Rejection Reason</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this agent verification request. This will be sent to the agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Enter reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!reason.trim() || verificationMutation.isPending}
              >
                {verificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentApproval;
