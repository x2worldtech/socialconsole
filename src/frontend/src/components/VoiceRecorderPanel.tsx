import { Button } from '@/components/ui/button';
import { Trash2, Square, Play, Pause, Send } from 'lucide-react';
import LiveRecordingWaveform from './LiveRecordingWaveform';

interface VoiceRecorderPanelProps {
  mode: 'recording' | 'preview';
  duration: number;
  isPreviewPlaying: boolean;
  audioLevel?: number;
  onDiscard: () => void;
  onStop: () => void;
  onPlayPause: () => void;
  onSend: () => void;
}

export default function VoiceRecorderPanel({
  mode,
  duration,
  isPreviewPlaying,
  audioLevel = 0,
  onDiscard,
  onStop,
  onPlayPause,
  onSend,
}: VoiceRecorderPanelProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-2 max-w-4xl mx-auto bg-[#2a2a2a] rounded-2xl p-3">
      {/* Duration display - top left */}
      <div className="flex items-center gap-2">
        <span className="text-white/90 text-lg font-light tracking-wide">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Activity area - center, full width */}
      <div className="flex items-center justify-center py-2 w-full">
        {mode === 'recording' ? (
          <LiveRecordingWaveform audioLevel={audioLevel} />
        ) : (
          <div className="flex items-center gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-white/40"
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls - bottom row (left/center/right) */}
      <div className="flex items-center justify-between">
        {/* Left: Discard */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onDiscard}
          className="h-12 w-12 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Discard recording"
        >
          <Trash2 className="w-5 h-5 text-white/90" />
        </Button>

        {/* Center: Stop/Pause or Play/Pause */}
        {mode === 'recording' ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onStop}
            className="h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500 hover:bg-red-500/30 transition-colors"
            aria-label="Stop recording"
          >
            <Square className="w-6 h-6 text-red-500 fill-red-500" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onPlayPause}
            className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label={isPreviewPlaying ? 'Pause' : 'Play'}
          >
            {isPreviewPlaying ? (
              <Pause className="w-6 h-6 text-white/90" />
            ) : (
              <Play className="w-6 h-6 text-white/90 ml-1" />
            )}
          </Button>
        )}

        {/* Right: Send */}
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Send voice message"
        >
          <Send className="w-5 h-5 text-white/90" />
        </Button>
      </div>
    </div>
  );
}
