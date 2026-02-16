import { useEffect, useRef } from 'react';
import { useGetChannelMessages, useGetUserChannels, useGetAccessibleChannels, useIsChannelAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Hash, AlertCircle, LogIn, RefreshCw, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import MessageBubble from './MessageBubble';
import { Skeleton } from '@/components/ui/skeleton';
import ChannelSettingsDialog from './ChannelSettingsDialog';
import CommandEducationCenter from './CommandEducationCenter';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useNotifications } from '../hooks/useNotifications';
import type { Message } from '../backend';

interface ChatAreaProps {
  activeChannel: string | null;
  actorReady: boolean;
  actorInitializing: boolean;
}

export default function ChatArea({ activeChannel, actorReady, actorInitializing }: ChatAreaProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { 
    data: messages = [], 
    isLoading: messagesLoading, 
    isFetching: messagesFetching,
    isError: messagesError,
    error: messagesErrorObj,
    refetch: refetchMessages
  } = useGetChannelMessages(activeChannel);
  
  const { data: userChannels = [] } = useGetUserChannels();
  const { data: accessibleChannels = [] } = useGetAccessibleChannels();
  const { data: isAdmin = false } = useIsChannelAdmin(activeChannel);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();
  const { enabled: notificationsEnabled, showNotification } = useNotifications();
  const previousMessagesRef = useRef<Message[]>([]);

  const isAuthenticated = !!identity;
  const isJoined = activeChannel ? userChannels.includes(activeChannel) : false;
  const hasAccess = activeChannel ? accessibleChannels.some(ch => ch.name === activeChannel) : false;

  // Show skeleton placeholders while actor is initializing
  const showSkeletons = actorInitializing || (messagesLoading && actorReady && activeChannel);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect new messages and show notifications
  useEffect(() => {
    if (!notificationsEnabled || !activeChannel || !isAuthenticated || !identity) {
      previousMessagesRef.current = messages;
      return;
    }

    const previousMessages = previousMessagesRef.current;
    const currentUserPrincipal = identity.getPrincipal().toString();

    // Find new messages (not from current user)
    const newMessages = messages.filter(msg => {
      const isFromOther = msg.sender.toString() !== currentUserPrincipal;
      const isNew = !previousMessages.some(prev => 
        prev.timestamp === msg.timestamp && 
        prev.sender.toString() === msg.sender.toString()
      );
      return isFromOther && isNew;
    });

    // Show notification for new messages
    if (newMessages.length > 0 && previousMessages.length > 0) {
      const latestMessage = newMessages[newMessages.length - 1];
      const senderName = userProfile?.username || 'Someone';
      
      showNotification({
        title: `New message in #${activeChannel}`,
        body: latestMessage.content || '📎 Sent an attachment',
        tag: `channel-${activeChannel}`,
        data: { channel: activeChannel, messageId: latestMessage.timestamp.toString() }
      });
    }

    previousMessagesRef.current = messages;
  }, [messages, activeChannel, notificationsEnabled, isAuthenticated, identity, userProfile, showNotification]);

  if (!activeChannel) {
    return <CommandEducationCenter />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Channel Header - Fixed with responsive padding */}
      <div className="shrink-0 bg-card border-b border-border px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            {actorInitializing ? (
              <Skeleton className="h-5 sm:h-6 w-32" />
            ) : (
              <h2 className="text-base sm:text-lg font-semibold truncate">{activeChannel}</h2>
            )}
            {messagesFetching && !showSkeletons && (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>
          {isAuthenticated && isAdmin && actorReady && (
            <div className="shrink-0">
              <ChannelSettingsDialog channelName={activeChannel} />
            </div>
          )}
        </div>
      </div>

      {/* Messages Area - Scrollable ONLY with WhatsApp-style background */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 py-3 sm:py-4 min-h-0 chat-area-background"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto">
          {!isAuthenticated && actorReady && (
            <Alert className="mb-3 sm:mb-4 bg-primary/5 border-primary/20">
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                You&apos;re browsing as a guest. Sign in to create channels and send messages.
              </AlertDescription>
            </Alert>
          )}

          {!isJoined && hasAccess && actorReady && (
            <Alert className="mb-3 sm:mb-4">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                You haven&apos;t joined this channel yet. Use{' '}
                <code className="bg-background px-1 py-0.5 rounded text-[10px] sm:text-xs">/join {activeChannel}</code> to
                join{isAuthenticated ? ' and start chatting' : ' and view messages'}.
              </AlertDescription>
            </Alert>
          )}

          {showSkeletons ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-16 sm:w-20" />
                    <Skeleton className="h-12 sm:h-14 w-full max-w-xs rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : messagesError ? (
            <div className="text-center py-8 sm:py-12">
              <Alert variant="destructive" className="mb-4 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  {!isOnline ? (
                    <>
                      <WifiOff className="inline w-4 h-4 mr-1" />
                      You&apos;re offline. Messages will load when you&apos;re back online.
                    </>
                  ) : (
                    <>Failed to load messages. {messagesErrorObj?.message || 'Please try again.'}</>
                  )}
                </AlertDescription>
              </Alert>
              {isOnline && (
                <Button 
                  onClick={() => refetchMessages()} 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              )}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm">
              <p>
                {isAuthenticated 
                  ? 'No messages yet. Be the first to say something!' 
                  : 'No messages yet in this channel.'}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble
                key={`${msg.timestamp}-${index}`}
                message={msg}
                isOwn={msg.sender.toString() === identity?.getPrincipal().toString()}
                username={userProfile?.username || 'Unknown'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
