import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 p-4">
      <div className="text-center space-y-3">
        <p className="text-8xl font-black text-primary/20 select-none">404</p>
        <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          The page <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{location.pathname}</code> doesn't exist or may have been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
        <Link to="/">
          <Button size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
