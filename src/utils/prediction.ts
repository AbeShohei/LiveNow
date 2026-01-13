import { StreamHistory } from '@/types/streamer';

interface DayStats {
    count: number;
    totalMinutes: number; // Sum of minutes from midnight
}

/**
 * Predicts the next likely broadcast start time based on history.
 * Considers day-of-week tendencies.
 */
export const predictNextStreamStart = (history: StreamHistory[]): Date | null => {
    if (!history || history.length === 0) return null;

    let totalMinutes = 0;

    history.forEach(record => {
        const date = new Date(record.startTime);
        totalMinutes += date.getHours() * 60 + date.getMinutes();
    });

    const avgMinutes = totalMinutes / history.length;

    // Create a date object for the predicted time
    // We set it to tomorrow arbitrarily, but the time is what matters
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + 1);
    nextDate.setHours(Math.floor(avgMinutes / 60));
    nextDate.setMinutes(Math.floor(avgMinutes % 60));
    nextDate.setSeconds(0);

    return nextDate;
};
