
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function getTokenExpiry(hours: number = 24): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}
