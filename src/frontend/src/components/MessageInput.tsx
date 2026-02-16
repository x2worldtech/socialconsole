import { useState, useEffect, useRef } from 'react';
import {
  useGetUserChannels,
  useSendMessage,
  useCreateChannel,
  useJoinChannel,
  useJoinRandomChannel,
  useLeaveChannel,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Paperclip, Mic, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import LeaveChannelDialog from './LeaveChannelDialog';
import MediaLibraryDialog from './MediaLibraryDialog';
import VoiceRecorderPanel from './VoiceRecorderPanel';
import { AttachmentType, ExternalBlob } from '../backend';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface MessageInputProps {
  activeChannel: string | null;
  onChannelCreated?: (channelName: string) => void;
  onChannelLeft?: (channelName: string) => void;
}

const EXAMPLE_COMMANDS = [
  '/create chat',
  '/create cats',
  '/create xY7382',
  '/create crypto',
  '/join chat',
  '/join cats',
  '/join random',
  '/join xY7382',
  '/join crypto',
  '/leave chat',
  '/leave cats',
  '/leave xY7382',
  '/leave crypto',
];

const TYPING_SPEED = 80;
const BACKSPACE_SPEED = 40;
const PAUSE_AFTER_TYPING = 1500;
const PAUSE_AFTER_DELETING = 500;

export default function MessageInput({ activeChannel, onChannelCreated, onChannelLeft }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [channelToLeave, setChannelToLeave] = useState<string | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ id: string; type: AttachmentType; file: ExternalBlob }>>([]);
  
  // Voice recording states
  const [recordingMode, setRecordingMode] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const { identity } = useInternetIdentity();
  const { data: userChannels = [] } = useGetUserChannels();
  const sendMessage = useSendMessage();
  const createChannel = useCreateChannel(onChannelCreated);
  const joinChannel = useJoinChannel();
  const joinRandomChannel = useJoinRandomChannel(onChannelCreated);
  const leaveChannel = useLeaveChannel(onChannelLeft);
  const isOnline = useOnlineStatus();
  
  const voiceRecorder = useVoiceRecorder();
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const currentCommandIndexRef = useRef(0);
  const currentCharIndexRef = useRef(0);
  const isTypingRef = useRef(true);
  const micButtonRef = useRef<HTMLButtonElement>(null);

  const isAuthenticated = !!identity;
  const isJoined = activeChannel ? userChannels.includes(activeChannel) : false;
  const canSendVoice = isAuthenticated && activeChannel && isJoined && isOnline;

  // Animated typing effect
  useEffect(() => {
    if (message.trim() !== '' || isFocused || recordingMode !== 'idle') {
      setAnimatedText('');
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      const currentCommand = EXAMPLE_COMMANDS[currentCommandIndexRef.current];
      
      if (isTypingRef.current) {
        if (currentCharIndexRef.current < currentCommand.length) {
          setAnimatedText(currentCommand.slice(0, currentCharIndexRef.current + 1));
          currentCharIndexRef.current++;
          animationRef.current = setTimeout(animate, TYPING_SPEED);
        } else {
          isTypingRef.current = false;
          animationRef.current = setTimeout(animate, PAUSE_AFTER_TYPING);
        }
      } else {
        if (currentCharIndexRef.current > 0) {
          currentCharIndexRef.current--;
          setAnimatedText(currentCommand.slice(0, currentCharIndexRef.current));
          animationRef.current = setTimeout(animate, BACKSPACE_SPEED);
        } else {
          currentCommandIndexRef.current = (currentCommandIndexRef.current + 1) % EXAMPLE_COMMANDS.length;
          isTypingRef.current = true;
          animationRef.current = setTimeout(animate, PAUSE_AFTER_DELETING);
        }
      }
    };

    animationRef.current = setTimeout(animate, PAUSE_AFTER_DELETING);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [message, isFocused, recordingMode]);

  const handleLeaveConfirm = (shouldDelete: boolean) => {
    if (channelToLeave) {
      leaveChannel.mutate({ name: channelToLeave, shouldDelete });
      setLeaveDialogOpen(false);
      setChannelToLeave(null);
    }
  };

  const handleMediaSelected = (attachments: Array<{ id: string; type: AttachmentType; file: ExternalBlob }>) => {
    setPendingAttachments(attachments);
    if (!message.trim()) {
      handleSendWithAttachments(attachments);
    }
  };

  const handleSendWithAttachments = async (attachments: Array<{ id: string; type: AttachmentType; file: ExternalBlob }>) => {
    if (!isOnline) {
      toast.error("You're offline. Cannot send messages.");
      return;
    }

    if (!isAuthenticated) {
      toast.error('You must be logged in to send media');
      return;
    }

    if (!activeChannel) {
      toast.error('Please select a channel first');
      return;
    }

    if (!isJoined) {
      toast.error(`You must join this channel first. Use /join ${activeChannel}`);
      return;
    }

    const content = message.trim() || '';
    
    sendMessage.mutate({
      channel: activeChannel,
      content,
      attachments,
    });
    
    setMessage('');
    setPendingAttachments([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && pendingAttachments.length === 0) return;

    if (!isOnline) {
      toast.error("You're offline. Cannot send messages.");
      return;
    }

    if (pendingAttachments.length > 0) {
      handleSendWithAttachments(pendingAttachments);
      return;
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.startsWith('/')) {
      const parts = trimmedMessage.split(' ');
      const command = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      if (command === '/create') {
        if (!isAuthenticated) {
          toast.error('You must be logged in to create channels');
          return;
        }
        if (!arg) {
          toast.error('Usage: /create channelname');
          return;
        }
        createChannel.mutate(arg);
        setMessage('');
        return;
      } else if (command === '/join') {
        if (!arg) {
          toast.error('Usage: /join channelname or /join random');
          return;
        }
        if (arg.toLowerCase() === 'random') {
          joinRandomChannel.mutate();
        } else {
          joinChannel.mutate(arg);
        }
        setMessage('');
        return;
      } else if (command === '/leave') {
        if (!arg) {
          toast.error('Usage: /leave channelname');
          return;
        }
        if (isAuthenticated) {
          setChannelToLeave(arg);
          setLeaveDialogOpen(true);
        } else {
          leaveChannel.mutate({ name: arg });
        }
        setMessage('');
        return;
      } else {
        toast.error(
          isAuthenticated 
            ? 'Unknown command. Available: /create, /join, /leave'
            : 'Unknown command. Available for guests: /join, /leave'
        );
        return;
      }
    }

    if (!isAuthenticated) {
      toast.error('You must be logged in to send messages');
      return;
    }

    if (!activeChannel) {
      toast.error('Please select a channel first');
      return;
    }

    if (!isJoined) {
      toast.error(`You must join this channel first. Use /join ${activeChannel}`);
      return;
    }

    sendMessage.mutate({
      channel: activeChannel,
      content: trimmedMessage,
      attachments: [],
    });
    setMessage('');
  };

  // Voice recording handlers
  const handleMicPress = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!canSendVoice) return;

    try {
      await voiceRecorder.startRecording();
      setRecordingMode('recording');
    } catch (error) {
      toast.error('Failed to access microphone');
    }
  };

  const handleDiscard = () => {
    voiceRecorder.cancelRecording();
    setRecordingMode('idle');
    setIsPreviewPlaying(false);
  };

  const handleStop = () => {
    voiceRecorder.stopRecording();
    
    // Check minimum duration
    if (voiceRecorder.duration < 1.0) {
      voiceRecorder.cancelRecording();
      setRecordingMode('idle');
      toast.info('Recording too short (minimum 1 second)');
    } else {
      setRecordingMode('preview');
    }
  };

  const handlePlayPause = () => {
    if (isPreviewPlaying) {
      voiceRecorder.pausePreview();
      setIsPreviewPlaying(false);
    } else {
      voiceRecorder.playPreview();
      setIsPreviewPlaying(true);
    }
  };

  const handleSendVoice = async () => {
    if (!activeChannel || !isAuthenticated || !isJoined || !isOnline) {
      if (!isOnline) {
        toast.error("You're offline. Cannot send voice messages.");
      }
      return;
    }

    // If still recording, stop first
    if (recordingMode === 'recording') {
      voiceRecorder.stopRecording();
      
      // Check minimum duration
      if (voiceRecorder.duration < 1.0) {
        voiceRecorder.cancelRecording();
        setRecordingMode('idle');
        toast.info('Recording too short (minimum 1 second)');
        return;
      }

      // Wait a brief moment for the blob to be ready after stopping
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const audioBytes = await voiceRecorder.getAudioBytes();
    if (!audioBytes) {
      toast.error('No audio recorded');
      return;
    }

    // Cast to the expected type
    const voiceBlob = ExternalBlob.fromBytes(audioBytes as Uint8Array<ArrayBuffer>);
    const voiceAttachment = {
      id: `voice-${Date.now()}`,
      type: 'voice' as AttachmentType,
      file: voiceBlob,
    };

    sendMessage.mutate({
      channel: activeChannel,
      content: '',
      attachments: [voiceAttachment],
    });

    voiceRecorder.cancelRecording();
    setRecordingMode('idle');
    setIsPreviewPlaying(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isValidGuestCommand = () => {
    if (isAuthenticated) return true;
    const trimmed = message.trim().toLowerCase();
    return trimmed.startsWith('/join ') || trimmed.startsWith('/leave ');
  };

  const isProcessing = sendMessage.isPending || createChannel.isPending || joinChannel.isPending || joinRandomChannel.isPending || leaveChannel.isPending;
  const isButtonDisabled = (!message.trim() && pendingAttachments.length === 0) || (!isAuthenticated && !isValidGuestCommand()) || !isOnline;

  return (
    <>
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4">
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 mb-2 text-xs text-muted-foreground">
            <WifiOff className="w-3 h-3" />
            <span>You&apos;re offline - messages cannot be sent</span>
          </div>
        )}
        
        {recordingMode === 'idle' && (
          <form onSubmit={handleSendMessage} className="flex gap-1.5 sm:gap-2 max-w-4xl mx-auto">
            {isAuthenticated && activeChannel && isJoined && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl hover:bg-primary/10 transition-all shrink-0"
                onClick={() => setMediaDialogOpen(true)}
                disabled={isProcessing || !isOnline}
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </Button>
            )}
            
            <div className="relative flex-1 min-w-0">
              <Input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 h-10 sm:h-11 md:h-12 bg-background border-border focus-visible:ring-primary transition-all text-sm sm:text-base"
                style={{ fontSize: '16px' }}
                disabled={!isOnline}
              />
              {animatedText && !message && !isFocused && (
                <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                  <span className="text-muted-foreground/60 font-mono text-xs sm:text-sm md:text-base truncate">
                    {animatedText}
                    <span className="inline-block w-0.5 h-3 sm:h-4 bg-primary/60 ml-0.5 animate-pulse" />
                  </span>
                </div>
              )}
              {pendingAttachments.length > 0 && (
                <div className="absolute -top-7 sm:-top-8 left-0 right-0 flex items-center gap-2 px-2 sm:px-3 py-1 bg-primary/10 rounded-t-lg text-[10px] sm:text-xs text-primary">
                  <Paperclip className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {pendingAttachments.length} file(s) ready to send
                </div>
              )}
            </div>

            {canSendVoice && (
              <Button
                ref={micButtonRef}
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl hover:bg-primary/10 transition-all shrink-0"
                onClick={handleMicPress}
                disabled={isProcessing || !isOnline}
                aria-label="Record voice message"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </Button>
            )}

            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shrink-0"
              disabled={isButtonDisabled}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </form>
        )}

        {(recordingMode === 'recording' || recordingMode === 'preview') && (
          <VoiceRecorderPanel
            mode={recordingMode}
            duration={voiceRecorder.duration}
            isPreviewPlaying={isPreviewPlaying}
            audioLevel={voiceRecorder.audioLevel}
            onDiscard={handleDiscard}
            onStop={handleStop}
            onPlayPause={handlePlayPause}
            onSend={handleSendVoice}
          />
        )}
      </div>

      <LeaveChannelDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        channelName={channelToLeave}
        onConfirm={handleLeaveConfirm}
      />

      <MediaLibraryDialog
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        onMediaSelected={handleMediaSelected}
      />
    </>
  );
}
