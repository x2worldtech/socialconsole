import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import MessageInput from './MessageInput';
import OfflineBanner from './OfflineBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface ChatLayoutProps {
  actorReady: boolean;
  actorInitializing: boolean;
}

export default function ChatLayout({ actorReady, actorInitializing }: ChatLayoutProps) {
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const handleChannelSelect = (channel: string) => {
    setActiveChannel(channel);
    setSidebarOpen(false);
  };

  const handleChannelLeft = (channelName: string) => {
    // If the user leaves the currently active channel, clear the active channel
    if (activeChannel === channelName) {
      setActiveChannel(null);
    }
  };

  const handleChatAreaClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="mobile-safe-layout w-full bg-background">
      {/* Fixed Header - responsive height */}
      <Header onMenuToggle={toggleSidebar} actorReady={actorReady} />

      {/* Offline Banner */}
      {!isOnline && <OfflineBanner />}

      {/* Main Content Area - takes remaining height with proper mobile handling */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        {/* Sidebar - Responsive width based on screen size */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-30 
            w-[85vw] sm:w-[70vw] md:w-80 lg:w-[25vw] xl:w-[20vw] 2xl:w-80
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:flex lg:flex-col overflow-hidden
          `}
          style={{ 
            top: 'var(--header-height, 64px)', 
            bottom: 0,
            maxWidth: '400px'
          }}
        >
          <Sidebar
            activeChannel={activeChannel}
            onChannelSelect={handleChannelSelect}
            actorReady={actorReady}
            actorInitializing={actorInitializing}
          />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ top: 'var(--header-height, 64px)' }}
          />
        )}

        {/* Chat Area - flex container that takes remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" onClick={handleChatAreaClick}>
          {/* Scrollable chat messages */}
          <ChatArea 
            activeChannel={activeChannel} 
            actorReady={actorReady}
            actorInitializing={actorInitializing}
          />
          
          {/* Fixed Message Input at bottom with mobile safe area support */}
          <div className="mobile-input-container bg-card border-t border-border">
            <MessageInput 
              activeChannel={activeChannel} 
              onChannelCreated={handleChannelSelect}
              onChannelLeft={handleChannelLeft}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
