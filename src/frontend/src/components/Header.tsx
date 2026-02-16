import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, LogOut, Moon, Sun, Bell, BellOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import LevelProgressBar from './LevelProgressBar';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '../hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuToggle?: () => void;
  actorReady: boolean;
}

export default function Header({ onMenuToggle, actorReady }: HeaderProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { isSupported, permission, enabled, toggleEnabled } = useNotifications();

  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleToggleNotifications = async () => {
    await toggleEnabled();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationLabel = () => {
    if (!isSupported) return 'Notifications not supported';
    if (permission === 'denied') return 'Notifications blocked';
    return enabled ? 'Disable notifications' : 'Enable notifications';
  };

  return (
    <header 
      className="bg-card border-b border-border px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0"
      style={{ '--header-height': '64px' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {onMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="rounded-full lg:hidden shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            aria-label="Toggle channel menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
        <div className="min-w-0 flex items-center gap-2 sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">SocialConsole</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">
              Command-based chat
            </p>
          </div>
          {isAuthenticated && actorReady && !profileLoading && <LevelProgressBar />}
          {isAuthenticated && (!actorReady || profileLoading) && (
            <Skeleton className="h-6 w-24" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>

        {!isAuthenticated ? (
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="rounded-full text-sm sm:text-base px-3 sm:px-4 h-9 sm:h-10"
          >
            {isLoggingIn ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Logging in...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              'Login'
            )}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 h-9 sm:h-10">
                {profileLoading || !actorReady ? (
                  <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
                ) : (
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                      {userProfile ? getInitials(userProfile.username) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="hidden md:inline font-medium text-sm truncate max-w-[100px] lg:max-w-[150px]">
                  {profileLoading || !actorReady ? '...' : (userProfile?.username || 'User')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 sm:w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">
                  {userProfile?.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Settings
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleToggleNotifications}
                disabled={!isSupported || permission === 'denied'}
              >
                {enabled ? (
                  <BellOff className="w-4 h-4 mr-2" />
                ) : (
                  <Bell className="w-4 h-4 mr-2" />
                )}
                <span className="text-sm">{getNotificationLabel()}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
