import { useEffect, useState } from 'react';
import { useGetGlobalAppStatistics } from '../hooks/useQueries';

interface StatDisplay {
  label: string;
  getValue: (stats: { totalChannelsCreated: bigint; totalRegisteredUsers: bigint; totalMessagesSent: bigint; totalXpGained: bigint }) => string;
}

const statistics: StatDisplay[] = [
  {
    label: 'Channels Created',
    getValue: (stats) => stats.totalChannelsCreated.toString(),
  },
  {
    label: 'Registered Users',
    getValue: (stats) => stats.totalRegisteredUsers.toString(),
  },
  {
    label: 'Messages Sent',
    getValue: (stats) => stats.totalMessagesSent.toString(),
  },
  {
    label: 'Total XP Gained',
    getValue: (stats) => stats.totalXpGained.toString(),
  },
];

export default function RotatingAppStatistics() {
  const { data: stats } = useGetGlobalAppStatistics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % statistics.length);
        setFade(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return null;
  }

  const currentStat = statistics[currentIndex];

  return (
    <div className="mb-6 sm:mb-8">
      <div
        className={`transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
        style={{ minHeight: '80px' }}
      >
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
            {currentStat.getValue(stats)}
          </div>
          <div className="text-sm sm:text-base text-muted-foreground font-medium">
            {currentStat.label}
          </div>
        </div>
      </div>
    </div>
  );
}
