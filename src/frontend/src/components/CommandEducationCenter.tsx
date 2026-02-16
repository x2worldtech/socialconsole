import { useEffect, useState } from 'react';
import { Hash } from 'lucide-react';
import RotatingAppStatistics from './RotatingAppStatistics';

const commands = [
  {
    command: '/create (channelname)',
    description: 'Create a new chat channel and become its admin. Only available for authenticated users.',
    example: '/create gaming',
  },
  {
    command: '/join (channelname)',
    description: 'Join an existing channel to view and participate in conversations.',
    example: '/join general',
  },
  {
    command: '/join random',
    description: 'Join a random public channel that allows random joining and has available capacity.',
    example: '/join random',
  },
  {
    command: '/leave (channelname)',
    description: 'Leave a channel. Admins can choose to delete the channel or just leave it.',
    example: '/leave gaming',
  },
];

export default function CommandEducationCenter() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % commands.length);
        setFade(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentCommand = commands[currentIndex];

  return (
    <div className="flex-1 flex items-center justify-center bg-background overflow-hidden p-4 sm:p-6">
      <div className="text-center space-y-4 sm:space-y-6 max-w-2xl w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Hash className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>
        
        <RotatingAppStatistics />
        
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground inline-flex items-center justify-center gap-2">
            Welcome to SocialConsole
            <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-4">
            Select a channel from the sidebar or use commands to get started
          </p>
        </div>

        <div
          className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-left">
            <div className="flex items-center gap-2">
              <code className="bg-primary/10 text-primary px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-mono text-xs sm:text-sm font-semibold break-all">
                {currentCommand.command}
              </code>
            </div>
            
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              {currentCommand.description}
            </p>
            
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">Example:</p>
              <code className="bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm text-foreground inline-block break-all">
                {currentCommand.example}
              </code>
            </div>
          </div>

          <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
            {commands.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-6 sm:w-8 bg-primary'
                    : 'w-1.5 sm:w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
