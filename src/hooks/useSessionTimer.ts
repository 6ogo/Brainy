import { useEffect, useState } from 'react';
import { useStore } from '../store/store';

export const useSessionTimer = () => {
  const { sessionStats, updateSessionStats } = useStore();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      updateSessionStats({ duration: elapsedTime + 1 });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [elapsedTime, updateSessionStats]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedHours = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
  };

  return {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    startTime: sessionStats.startTime,
  };
};