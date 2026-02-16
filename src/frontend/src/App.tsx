import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useActorExtended } from './hooks/useActorExtended';
import { ThemeProvider } from 'next-themes';
import ProfileSetupModal from './components/ProfileSetupModal';
import ChatLayout from './components/ChatLayout';
import { Toaster } from '@/components/ui/sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function App() {
  useEffect(() => {
    // Register service worker for PWA support
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { 
    actor,
    isError: actorError,
    error: actorErrorObj,
    refetch: refetchActor,
    status: actorStatus,
    isFetching: actorFetching
  } = useActorExtended();
  
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched,
    isError: profileError,
    error: profileErrorObj
  } = useGetCallerUserProfile();
  
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (isAuthenticated && !profileLoading && isFetched && userProfile === null && !profileError) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile, profileError]);

  // Show backend connection error with retry (non-blocking)
  if (actorError && !actorFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Connection Error</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>
              {actorErrorObj?.message || 'Failed to connect to the backend. Please check your connection and try again.'}
            </p>
            <Button 
              onClick={() => refetchActor()} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {showProfileSetup && (
        <ProfileSetupModal onComplete={() => setShowProfileSetup(false)} />
      )}
      {!showProfileSetup && (
        <ChatLayout 
          actorReady={!!actor && !actorFetching} 
          actorInitializing={isInitializing || actorStatus === 'pending'}
        />
      )}
    </>
  );
}
