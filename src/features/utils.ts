export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function formatDuration(ms: number) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return hours > 0
    ? `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
}
