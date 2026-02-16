import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Download } from 'lucide-react';
import type { Message, AttachmentType } from '../backend';
import { parseTextWithLinks } from '@/lib/linkify';
import VoiceMessagePlayer from './VoiceMessagePlayer';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  username: string;
}

export default function MessageBubble({ message, isOwn, username }: MessageBubbleProps) {
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const loadMediaUrls = async () => {
      const urls = new Map<string, string>();
      
      for (const attachment of message.attachments) {
        try {
          if (attachment.type === 'image' || attachment.type === 'gif' || attachment.type === 'voice') {
            const url = attachment.file.getDirectURL();
            urls.set(attachment.id, url);
          } else if (attachment.type === 'document') {
            const url = attachment.file.getDirectURL();
            urls.set(attachment.id, url);
          }
        } catch (error) {
          console.error('Failed to load media URL:', error);
        }
      }
      
      setMediaUrls(urls);
    };

    if (message.attachments.length > 0) {
      loadMediaUrls();
    }

    return () => {
      mediaUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [message.attachments]);

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAttachmentIcon = (type: AttachmentType) => {
    switch (type) {
      case 'document':
        return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      default:
        return null;
    }
  };

  const handleDownload = async (attachment: Message['attachments'][0]) => {
    try {
      const bytes = await attachment.file.getBytes();
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attachment-${attachment.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = parseTextWithLinks(content);
    
    return parts.map((part, index) => {
      if (part.type === 'link') {
        return (
          <a
            key={index}
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
            className={`message-link ${isOwn ? 'message-link-own' : 'message-link-other'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {part.content}
          </a>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };

  return (
    <div className={`flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-1.5 sm:gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <Avatar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0 self-end">
            <AvatarFallback className="bg-muted text-[10px] sm:text-xs">
              {getInitials(message.sender.toString().slice(0, 5))}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <span className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 px-1" style={{ color: 'oklch(0.65 0.15 145)' }}>
              {message.sender.toString().slice(0, 8)}...
            </span>
          )}
          <div
            className={`whatsapp-bubble ${
              isOwn ? 'whatsapp-bubble-own' : 'whatsapp-bubble-other'
            }`}
          >
            {message.attachments.length > 0 && (
              <div className="space-y-1.5 sm:space-y-2 mb-1.5 sm:mb-2">
                {message.attachments.map((attachment) => {
                  const mediaUrl = mediaUrls.get(attachment.id);
                  
                  if (attachment.type === 'image' || attachment.type === 'gif') {
                    return (
                      <div key={attachment.id} className="rounded-lg overflow-hidden max-w-[250px] sm:max-w-xs">
                        {mediaUrl ? (
                          <img
                            src={mediaUrl}
                            alt="Attachment"
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-24 sm:h-32 bg-muted/20 flex items-center justify-center">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">Loading...</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  if (attachment.type === 'voice') {
                    return mediaUrl ? (
                      <VoiceMessagePlayer
                        key={attachment.id}
                        audioUrl={mediaUrl}
                        isOwn={isOwn}
                      />
                    ) : (
                      <div key={attachment.id} className="text-[10px] sm:text-xs text-muted-foreground">
                        Loading...
                      </div>
                    );
                  }
                  
                  if (attachment.type === 'document') {
                    return (
                      <div
                        key={attachment.id}
                        className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg ${
                          isOwn ? 'bg-white/10' : 'bg-black/5'
                        }`}
                      >
                        {getAttachmentIcon(attachment.type)}
                        <button
                          onClick={() => handleDownload(attachment)}
                          className="p-0.5 sm:p-1 hover:bg-white/10 rounded transition-colors ml-auto"
                        >
                          <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            )}
            
            {message.content && (
              <p className="text-xs sm:text-sm md:text-[15px] leading-[1.4] whitespace-pre-wrap mb-0.5 sm:mb-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {renderMessageContent(message.content)}
              </p>
            )}
            
            <div className={`flex items-center justify-end gap-1 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
              <span className="text-[9px] sm:text-[10px] md:text-[11px]">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
