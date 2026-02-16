import { useState, useEffect } from 'react';
import { Settings, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useGetRandomJoinEnabled, useSetRandomJoinEnabled, useGetChannelDetails, useSetChannelMaxMembers } from '../hooks/useQueries';

interface ChannelSettingsDialogProps {
  channelName: string;
}

export default function ChannelSettingsDialog({ channelName }: ChannelSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: randomJoinEnabled = true, isLoading: randomJoinLoading } = useGetRandomJoinEnabled(channelName);
  const { data: channelDetails } = useGetChannelDetails(channelName);
  const setRandomJoinEnabled = useSetRandomJoinEnabled();
  const setChannelMaxMembers = useSetChannelMaxMembers();

  const [maxMembersInput, setMaxMembersInput] = useState('');
  const [hasLimit, setHasLimit] = useState(false);

  // Initialize state when channel details load
  useEffect(() => {
    if (channelDetails) {
      const currentLimit = channelDetails.maxMembers;
      if (currentLimit !== undefined) {
        setHasLimit(true);
        setMaxMembersInput(currentLimit.toString());
      } else {
        setHasLimit(false);
        setMaxMembersInput('');
      }
    }
  }, [channelDetails]);

  const handleToggleRandomJoin = async (checked: boolean) => {
    setRandomJoinEnabled.mutate({ channelName, isEnabled: checked });
  };

  const handleToggleLimit = (checked: boolean) => {
    setHasLimit(checked);
    if (!checked) {
      // Remove limit
      setChannelMaxMembers.mutate({ channelName, maxMembers: null });
      setMaxMembersInput('');
    }
  };

  const handleSaveLimit = () => {
    const value = parseInt(maxMembersInput, 10);
    if (isNaN(value) || value < 1) {
      return;
    }
    setChannelMaxMembers.mutate({ channelName, maxMembers: BigInt(value) });
  };

  const handleMaxMembersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      setMaxMembersInput(value);
    }
  };

  const isValidLimit = maxMembersInput !== '' && parseInt(maxMembersInput, 10) >= 1;
  const hasUnsavedChanges = hasLimit && channelDetails?.maxMembers?.toString() !== maxMembersInput && isValidLimit;

  // Calculate current member count (count of users who have joined this channel)
  // This is approximated from the channel details - in a real scenario, you'd query this from backend
  const currentMemberCount = '...'; // Placeholder - backend doesn't expose this directly yet

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          title="Channel Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Channel Settings</DialogTitle>
          <DialogDescription>
            Configure settings for #{channelName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Random Join Setting */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="random-join" className="text-sm font-medium">
                Allow Random Joining
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users can join this channel using the <code className="bg-muted px-1 py-0.5 rounded text-xs">/join random</code> command
              </p>
            </div>
            <Switch
              id="random-join"
              checked={randomJoinEnabled}
              onCheckedChange={handleToggleRandomJoin}
              disabled={randomJoinLoading || setRandomJoinEnabled.isPending}
            />
          </div>

          <Separator />

          {/* Member Limit Setting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="member-limit" className="text-sm font-medium">
                  Set Member Limit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Restrict the maximum number of users who can join this channel
                </p>
              </div>
              <Switch
                id="member-limit"
                checked={hasLimit}
                onCheckedChange={handleToggleLimit}
                disabled={setChannelMaxMembers.isPending}
              />
            </div>

            {hasLimit && (
              <div className="space-y-3 pl-0">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="max-members" className="text-sm">
                    Maximum Members
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="max-members"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={maxMembersInput}
                    onChange={handleMaxMembersChange}
                    placeholder="Enter limit (e.g., 50)"
                    className="flex-1"
                    disabled={setChannelMaxMembers.isPending}
                  />
                  {hasUnsavedChanges && (
                    <Button
                      onClick={handleSaveLimit}
                      disabled={!isValidLimit || setChannelMaxMembers.isPending}
                      size="sm"
                    >
                      Save
                    </Button>
                  )}
                </div>
                {channelDetails?.maxMembers !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Current limit: {channelDetails.maxMembers.toString()} members
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
