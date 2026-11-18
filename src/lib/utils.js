import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Joins class names; with tailwind-merge a caller's className overrides the defaults.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
