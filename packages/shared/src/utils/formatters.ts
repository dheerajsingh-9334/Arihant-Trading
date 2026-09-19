/**
 * Formats a number to Indian currency format, e.g. ₹ 1,50,000 or ₹ 46.00 Lakh
 */
export function formatIndianCurrency(amount: number | null | undefined, compact: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} Lakh`;
    }
  }

  // Indian standard numbering grouping (XX,XX,XXX)
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const [integerPart, decimalPart] = absAmount.toFixed(2).split('.');

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = `₹ ${formattedInt}${decimalPart && decimalPart !== '00' ? '.' + decimalPart : ''}`;

  return isNegative ? `-${result}` : result;
}

export const formatINR = (amount: number | null | undefined) => formatIndianCurrency(amount, false);

export const formatLakh = (lakhs: number | null | undefined): string => {
  if (lakhs === null || lakhs === undefined || isNaN(lakhs)) return '—';
  return `₹ ${Number(lakhs).toFixed(2)} Lakh`;
};

/**
 * Robustly parses Indian text amount formats:
 * e.g. "46 Lakh" -> 4600000, "1.5 Cr" -> 15000000, "1.0E7" -> 10000000, "NA" -> null
 */
export function parseIndianAmount(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const str = String(val).trim();
  if (!str || str.toUpperCase() === 'NA' || str === '-') return null;

  const lower = str.toLowerCase().replace(/,/g, '');
  if (lower.includes('lakh')) {
    const num = parseFloat(lower.replace('lakh', '').trim());
    return isNaN(num) ? null : num * 100000;
  }
  if (lower.includes('cr') || lower.includes('crore')) {
    const num = parseFloat(lower.replace(/cr(ore)?/, '').trim());
    return isNaN(num) ? null : num * 10000000;
  }

  const parsed = parseFloat(lower);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats a UTC date or ISO string to Asia/Kolkata (IST) display format
 */
export function formatISTDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatISTDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Returns days remaining until deadline and flags if closing within 7 days
 */
export function getDeadlineInfo(closingDate: string | Date | null | undefined): {
  daysRemaining: number | null;
  isUrgent: boolean; // closing within 7 days
  isOverdue: boolean;
  label: string;
} {
  if (!closingDate) {
    return { daysRemaining: null, isUrgent: false, isOverdue: false, label: 'No date set' };
  }

  const d = typeof closingDate === 'string' ? new Date(closingDate) : closingDate;
  if (isNaN(d.getTime())) {
    return { daysRemaining: null, isUrgent: false, isOverdue: false, label: 'Invalid date' };
  }

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      daysRemaining: diffDays,
      isUrgent: false,
      isOverdue: true,
      label: `Closed ${Math.abs(diffDays)}d ago`,
    };
  }

  if (diffDays === 0) {
    return {
      daysRemaining: 0,
      isUrgent: true,
      isOverdue: false,
      label: 'Closes today!',
    };
  }

  return {
    daysRemaining: diffDays,
    isUrgent: diffDays <= 7,
    isOverdue: false,
    label: `${diffDays} days left`,
  };
}
