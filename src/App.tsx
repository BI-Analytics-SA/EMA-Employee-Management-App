import { RouterProvider } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Toaster } from "sonner";
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
        <Toaster />
      </>
    );
  }

  return (
    <ConvexAuthProvider client={convex}>
      <RouterProvider router={router} />
      <UpdateNotification />
      <Toaster />
    </ConvexAuthProvider>
  );
}

export default App;
