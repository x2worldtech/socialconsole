import { useGetCallerUserLevelProgress } from '../hooks/useQueries';
import { useEffect, useState } from 'react';

export default function LevelProgressBar() {
  const { data: levelData, isLoading } = useGetCallerUserLevelProgress();
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (levelData) {
      const progressPercent = levelData.progress * 100;
      const timer = setTimeout(() => {
        setDisplayProgress(progressPercent);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [levelData]);

  if (isLoading || !levelData) {
    return null;
  }

  const progressPercent = levelData.progress * 100;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      <span className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
        Lv {levelData.level}
      </span>
      <div className="relative w-16 sm:w-20 md:w-24 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-yellow-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
}
