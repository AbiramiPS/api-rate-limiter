import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WindowUnit } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWindow(value: number, unit: WindowUnit): string {
  const s = value === 1 ? '' : 's';
  const unitFormatted = unit.toLowerCase();
  return `${value} ${unitFormatted}${s}`;
}

export function formatRuleSpec(maxRequests: number, value: number, unit: WindowUnit): string {
  return `${maxRequests} req / ${formatWindow(value, unit)}`;
}

export function getWindowInSeconds(value: number, unit: WindowUnit): number {
  switch (unit) {
    case 'SECOND':
      return value;
    case 'MINUTE':
      return value * 60;
    case 'HOUR':
      return value * 3600;
    case 'DAY':
      return value * 86400;
    default:
      return value * 60;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
