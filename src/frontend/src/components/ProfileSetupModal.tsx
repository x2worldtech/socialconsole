import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        joinedChannels: [],
        xp: BigInt(0),
        level: BigInt(0),
      });
      onComplete();
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to SocialConsole</h2>
            <p className="text-muted-foreground">
              Let's set up your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                required
                autoFocus
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                This is how others will see you in chat
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={!username.trim() || saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Profile...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
