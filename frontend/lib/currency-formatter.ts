import type { Currency } from '@/hooks/use-currencies';

/**
 * Currency formatter using configured symbol from backend
 */

// Cache for currencies to avoid repeated API calls
let currenciesCache: Currency[] | null = null;
let currenciesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Set currencies cache (called after fetching currencies)
 */
export function setCurrenciesCache(currencies: Currency[]) {
  currenciesCache = currencies;
  currenciesCacheTime = Date.now();
}

/**
 * Get symbol for a currency code from cache
 */
function getCurrencySymbol(currencyCode: string): string {
  // Check cache first
  if (currenciesCache && Date.now() - currenciesCacheTime < CACHE_DURATION) {
    const currency = currenciesCache.find(c => c.code === currencyCode);
    if (currency?.symbol) {
      return currency.symbol;
    }
  }
  
  // Fallback to default symbols for common currencies
  const defaultSymbols: { [key: string]: string } = {
    USD: '$',
    HKD: 'HK$',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KRW: '₩',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
  };
  
  return defaultSymbols[currencyCode] || currencyCode;
}

/**
 * Get decimal places for a currency code from cache
 */
function getDecimalPlaces(currencyCode: string): number {
  if (currenciesCache && Date.now() - currenciesCacheTime < CACHE_DURATION) {
    const currency = currenciesCache.find(c => c.code === currencyCode);
    if (currency?.decimal_places !== undefined) {
      return currency.decimal_places;
    }
  }
  
  // Fallback defaults
  const cryptoCurrencies = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC'];
  if (cryptoCurrencies.includes(currencyCode)) {
    return 8;
  }
  
  return 2;
}

/**
 * Format currency amount using configured symbol from backend
 * 
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g., 'USD', 'HKD')
 * @param options - Formatting options
 * @returns Formatted currency string like "$1,234.56" or "US$1,234.56"
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options?: {
    /** Show currency code after amount instead of symbol */
    showCode?: boolean;
    /** Number of decimal places (overrides currency default) */
    decimals?: number;
  }
): string {
  // Handle undefined, null, or NaN
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '-';
  }

  const symbol = getCurrencySymbol(currencyCode);
  const decimals = options?.decimals ?? getDecimalPlaces(currencyCode);
  const showCode = options?.showCode ?? false;

  // Format the number with appropriate decimals
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  // Combine symbol and number
  if (showCode) {
    return `${formattedNumber} ${currencyCode}`;
  }

  return `${symbol}${formattedNumber}`;
}

/**
 * Format currency with negative handling (proper parentheses or minus sign)
 */
export function formatCurrencyWithSign(
  amount: number,
  currencyCode: string = 'USD',
  options?: {
    useParentheses?: boolean;
    decimals?: number;
  }
): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '-';
  }

  const absAmount = Math.abs(amount);
  const formatted = formatCurrency(absAmount, currencyCode, options);
  const useParentheses = options?.useParentheses ?? false;

  if (amount < 0) {
    return useParentheses ? `(${formatted})` : `-${formatted}`;
  }

  return formatted;
}

/**
 * Format multiple currencies display
 */
export function formatMultiCurrency(
  amounts: { [currency: string]: number } | null | undefined,
  options?: {
    showCode?: boolean;
  }
): string[] {
  if (!amounts || Object.keys(amounts).length === 0) {
    return [];
  }

  return Object.entries(amounts)
    .filter(([, amount]) => amount !== undefined && amount !== null && !Number.isNaN(amount) && Math.abs(amount) > 0.001)
    .map(([currency, amount]) => formatCurrency(amount, currency, options));
}
