import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  roles = ["seller", "agent", "admin"],
}: {
  path: string;
  component: () => React.JSX.Element;
  roles?: string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth?mode=login" />
      </Route>
    );
  }

  // Special handling for root routes like /seller, /agent, /admin
  // to ensure users can only access their correct dashboard
  if (path === '/seller' || path === '/agent' || path === '/admin') {
    const routeRole = path.substring(1); // Remove the leading slash
    
    if (user.role !== routeRole) {
      // If trying to access a wrong dashboard, redirect to their correct one
      setTimeout(() => {
        setLocation(`/${user.role}`);
      }, 100);
      
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
            <span className="ml-2">Redirecting to your dashboard...</span>
          </div>
        </Route>
      );
    }
  }
  // For other protected routes, check general role permissions
  else if (!roles.includes(user.role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button 
            onClick={() => setLocation(`/${user.role}`)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
