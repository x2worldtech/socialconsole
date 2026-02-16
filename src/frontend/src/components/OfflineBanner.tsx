import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OfflineBanner() {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-destructive/10 border-destructive/30">
      <WifiOff className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-sm text-destructive">
        You're offline. Some features may be unavailable.
      </AlertDescription>
    </Alert>
  );
}
