import { useIsChannelAdmin } from '../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LeaveChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string | null;
  onConfirm: (shouldDelete: boolean) => void;
}

export default function LeaveChannelDialog({
  open,
  onOpenChange,
  channelName,
  onConfirm,
}: LeaveChannelDialogProps) {
  const { data: isAdmin = false } = useIsChannelAdmin(channelName);

  // If not admin, just leave without showing options
  const handleLeaveOnly = () => {
    onConfirm(false);
  };

  const handleLeaveAndDelete = () => {
    onConfirm(true);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Channel</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {isAdmin ? (
              <>
                <p>
                  You are the creator of <span className="font-semibold text-foreground">#{channelName}</span>.
                </p>
                <p>
                  Would you like to delete the channel entirely, or just leave it for other members?
                </p>
              </>
            ) : (
              <p>
                Are you sure you want to leave <span className="font-semibold text-foreground">#{channelName}</span>?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          {isAdmin ? (
            <>
              <AlertDialogAction
                onClick={handleLeaveOnly}
                className="bg-muted text-foreground hover:bg-muted/80"
              >
                Leave Only
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleLeaveAndDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Leave and Delete Channel
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              onClick={handleLeaveOnly}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Channel
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
