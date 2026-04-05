export const formatTime12Hour = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

export const formatTimeFromISO = (iso: string) => formatTime12Hour(new Date(iso));

export const formatDateLong = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const formatDateFromISO = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

// Returns Mon–Sun 'YYYY-MM-DD' strings for the week containing `date`
export const getWeekDates = (date: Date): string[] => {
  const result: string[] = [];
  const d = new Date(date);
  const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dayOfWeek);
  for (let i = 0; i < 7; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return result;
};

// Returns hours between two ISO timestamps, or null if inputs are invalid
export const calcHoursBetween = (clockInISO: string, clockOutISO: string): number | null => {
  if (!clockInISO || !clockOutISO) return null;
  const diff = new Date(clockOutISO).getTime() - new Date(clockInISO).getTime();
  if (diff <= 0) return null;
  return diff / (1000 * 60 * 60);
};

// Formats decimal hours as "Xh Ym", e.g. 8.5 → "8h 30m"
export const formatHoursDuration = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Formats 'YYYY-MM-DD' to "Mon, Apr 5"
export const formatLocalDate = (localDate: string): string => {
  const [year, month, day] = localDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
