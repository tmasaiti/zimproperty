import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component,
  roles = ["seller", "agent", "admin"],
}: {
  path: string;
  component: React.ComponentType<any>;
  roles?: string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Create a wrapper component that handles auth logic 
  const ProtectedComponent = (props: any) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }

    if (!user) {
      return <Redirect to="/auth?mode=login" />;
    }

    if (!roles.includes(user.role)) {
      return <Redirect to={`/${user.role}`} />;
    }

    const Component = component;
    return <Component {...props} />;
  };

  return <Route path={path} component={ProtectedComponent} />;
}
