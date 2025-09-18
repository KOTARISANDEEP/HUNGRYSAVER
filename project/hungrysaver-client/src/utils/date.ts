export type Dateish = any;

export function formatDateOrNow(
  input: Dateish,
  locale: string = 'en-IN',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
): string {
  try {
    let date: Date | null = null;

    if (input && typeof input.toDate === 'function') {
      date = input.toDate();
    } else if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'string') {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) date = parsed;
    } else if (typeof input === 'number') {
      const fromMillis = new Date(input);
      if (!isNaN(fromMillis.getTime())) date = fromMillis;
    }

    if (!date || isNaN(date.getTime())) {
      date = new Date();
    }

    return date.toLocaleDateString(locale, options);
  } catch {
    return new Date().toLocaleDateString(locale, options);
  }
}



