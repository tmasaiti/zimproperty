import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Activity, UserCheck, DollarSign, Database } from 'lucide-react';
import AgentApproval from '@/components/admin/agent-approval';
import LeadManagement from '@/components/admin/lead-management';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('dashboard');

  // Fetch system stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch pending agent verifications
  const { data: pendingAgents, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/admin/agent-verifications'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch flagged leads
  const { data: flaggedLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/admin/flagged-leads'],
    enabled: !!user && user.role === 'admin'
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
            <div className="text-red-500 font-bold text-xl mb-4">Access Denied</div>
            <p>You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600">Manage users, monitor platform activity, and ensure system integrity</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agent-approvals">
            Agent Approvals
            {pendingAgents && pendingAgents.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingAgents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads">Lead Management</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {statsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-primary-50 border border-primary-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-primary-800 mb-1">Pending Agent Approvals</p>
                        <p className="text-2xl font-bold text-primary-700">{stats?.pendingAgents || 0}</p>
                        <div className="mt-2 text-sm text-primary-600">
                          <button 
                            className="underline"
                            onClick={() => setSelectedTab('agent-approvals')}
                          >
                            View pending approvals
                          </button>
                        </div>
                      </div>
                      <div className="bg-primary-100 p-2 rounded-full">
                        <UserCheck className="h-6 w-6 text-primary-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-1">Active Leads</p>
                        <p className="text-2xl font-bold text-green-700">{stats?.activeLeads || 0}</p>
                        <div className="mt-2 text-sm text-green-600">
                          <button 
                            className="underline"
                            onClick={() => setSelectedTab('leads')}
                          >
                            Manage leads
                          </button>
                        </div>
                      </div>
                      <div className="bg-green-100 p-2 rounded-full">
                        <Activity className="h-6 w-6 text-green-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-secondary-50 border border-secondary-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-secondary-800 mb-1">Lead Purchases</p>
                        <p className="text-2xl font-bold text-secondary-700">{stats?.leadPurchases || 0}</p>
                        <div className="mt-2 text-sm text-secondary-600">
                          <span className="font-medium">${stats?.totalRevenue?.toFixed(2) || 0}</span> total revenue
                        </div>
                      </div>
                      <div className="bg-secondary-100 p-2 rounded-full">
                        <DollarSign className="h-6 w-6 text-secondary-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800 mb-1">System Uptime</p>
                        <p className="text-2xl font-bold text-gray-700">99.9%</p>
                        <div className="mt-2 text-sm text-green-600">
                          All systems operational
                        </div>
                      </div>
                      <div className="bg-gray-100 p-2 rounded-full">
                        <Database className="h-6 w-6 text-gray-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Verification Queue</CardTitle>
                    <CardDescription>
                      {(pendingAgents?.length || 0) > 0 
                        ? `${pendingAgents?.length} agent(s) waiting for verification` 
                        : 'No pending verifications'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AgentApproval 
                      pendingAgents={pendingAgents || []} 
                      loading={agentsLoading} 
                      limitDisplay={3} 
                      showViewAll={() => setSelectedTab('agent-approvals')}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Flagged Lead Reports</CardTitle>
                    <CardDescription>
                      {(flaggedLeads?.length || 0) > 0 
                        ? `${flaggedLeads?.length} lead(s) flagged for review` 
                        : 'No flagged leads'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeadManagement 
                      flaggedLeads={flaggedLeads || []} 
                      loading={leadsLoading} 
                      limitDisplay={3} 
                      showViewAll={() => setSelectedTab('leads')}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="agent-approvals">
          <Card>
            <CardHeader>
              <CardTitle>Agent Verification Queue</CardTitle>
              <CardDescription>Review and approve agent registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <AgentApproval 
                pendingAgents={pendingAgents || []} 
                loading={agentsLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Lead Reports</CardTitle>
              <CardDescription>Review and manage flagged property listings</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadManagement 
                flaggedLeads={flaggedLeads || []} 
                loading={leadsLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Financial performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Revenue chart visualization will be implemented here</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Agents</h3>
                  <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center h-64">
                    <p className="text-gray-500">Top agents visualization will be implemented here</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
                  <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center h-64">
                    <p className="text-gray-500">Revenue breakdown visualization will be implemented here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>Performance and security monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-green-800">API Services</h4>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Online
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-green-600">Response time: 120ms</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-green-800">Payment Gateway</h4>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Online
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-green-600">Last transaction: 5 min ago</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-green-800">Database</h4>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Online
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-green-600">Last backup: 2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent System Events</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="px-4 py-6 text-center text-gray-500">
                      System events log will be implemented here
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
