import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function numberToWords(num: number): string {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const formatTrio = (n: number) => {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    if (h > 0) res += single[h] + ' Hundred ';
    if (t === 1) res += double[o] + ' ';
    else {
      if (t > 1) res += tens[t] + ' ';
      if (o > 0) res += single[o] + ' ';
    }
    return res;
  };

  if (num === 0) return 'Zero';
  let res = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remaining = Math.floor(num % 1000);

  if (crore > 0) res += formatTrio(crore) + 'Crore ';
  if (lakh > 0) res += formatTrio(lakh) + 'Lakh ';
  if (thousand > 0) res += formatTrio(thousand) + 'Thousand ';
  if (remaining > 0) res += formatTrio(remaining);

  const paisa = Math.round((num % 1) * 100);
  if (paisa > 0) {
    res += 'and ' + formatTrio(paisa) + 'Paisa ';
  }

  return res.trim() + ' Only';
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(date: Date = new Date()): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function toDateTimeLocal(date: Date = new Date()): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toDateLocal(date: Date = new Date()): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}
