import { RouterProvider } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { router } from "./routes";
import { UpdateNotification } from "./components/UpdateNotification";

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

// Create Convex client only if URL is available
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function App() {
  // If Convex isn't configured yet, show setup instructions
  if (!convex) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Setup Required</h1>
            <p className="text-muted-foreground">
              Convex backend not configured. Please run:
            </p>
            <code className="block bg-muted p-3 rounded-md text-sm">
              npx convex dev
            </code>
            <p className="text-muted-foreground text-sm">
              This will create your Convex project and add the URL to your .env.local file.
            </p>
          </div>
        </div>
        <UpdateNotification />
      </>
    );
  }

  return (
    <ConvexAuthProvider client={convex}>
      <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground text-center text-xs py-1 font-medium">
        Version 3.0.0
      </div>
      <RouterProvider router={router} />
      <UpdateNotification />
    </ConvexAuthProvider>
  );
}

export default App;
