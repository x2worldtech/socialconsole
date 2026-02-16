import { useGetAccessibleChannels, useGetUserChannels } from '../hooks/useQueries';
import { Hash, Users, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeChannel: string | null;
  onChannelSelect: (channel: string) => void;
  actorReady: boolean;
  actorInitializing: boolean;
}

export default function Sidebar({ activeChannel, onChannelSelect, actorReady, actorInitializing }: SidebarProps) {
  const { 
    data: accessibleChannels = [], 
    isLoading: channelsLoading, 
    isFetching: channelsFetching,
    isError: channelsError,
    error: channelsErrorObj,
    refetch: refetchChannels
  } = useGetAccessibleChannels();
  
  const { data: userChannels = [] } = useGetUserChannels();

  // Show skeleton placeholders while actor is initializing
  const showSkeletons = actorInitializing || (channelsLoading && actorReady);

  return (
    <div className="h-full bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Fixed Header - responsive padding */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <span className="truncate">Channels</span>
          </h2>
          {channelsFetching && !showSkeletons && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
          {actorReady ? `${accessibleChannels.length} accessible • ${userChannels.length} joined` : 'Loading...'}
        </p>
      </div>

      {/* Scrollable Channel List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-1.5 sm:p-2 space-y-1">
          {showSkeletons ? (
            // Shimmer loading placeholders
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="w-8 h-5 rounded-full" />
                </div>
              ))}
            </div>
          ) : channelsError ? (
            // Error state with retry button
            <div className="p-3 sm:p-4">
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Failed to load channels. {channelsErrorObj?.message || 'Please try again.'}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => refetchChannels()} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Retry
              </Button>
            </div>
          ) : accessibleChannels.length === 0 ? (
            <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground">
              <p>No channels yet</p>
              <p className="text-[10px] sm:text-xs mt-1">Use /create to make one</p>
            </div>
          ) : (
            accessibleChannels.map((channel) => {
              const isActive = activeChannel === channel.name;
              const memberCount = Number(channel.memberCount);

              return (
                <button
                  key={channel.name}
                  onClick={() => onChannelSelect(channel.name)}
                  className={`
                    w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left
                    channel-item transition-all
                    ${isActive ? 'channel-item-active' : ''}
                  `}
                >
                  <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="flex-1 truncate font-medium text-sm sm:text-base">{channel.name}</span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs flex items-center gap-1 flex-shrink-0">
                    <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {memberCount}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Fixed Footer with Commands - responsive padding and text */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border bg-muted/30">
        <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-1">
          <p className="font-semibold text-foreground">Commands:</p>
          <p><code className="bg-background px-1 py-0.5 rounded text-[9px] sm:text-[10px]">/create name</code> - Create channel</p>
          <p><code className="bg-background px-1 py-0.5 rounded text-[9px] sm:text-[10px]">/join name</code> - Join channel</p>
          <p><code className="bg-background px-1 py-0.5 rounded text-[9px] sm:text-[10px]">/join random</code> - Join random public</p>
          <p><code className="bg-background px-1 py-0.5 rounded text-[9px] sm:text-[10px]">/leave name</code> - Leave channel</p>
        </div>
      </div>
    </div>
  );
}
