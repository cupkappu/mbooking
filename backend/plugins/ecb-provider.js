/**
 * ECB (European Central Bank) Exchange Rate Provider
 * 
 * Fetches exchange rates from the European Central Bank API.
 * Free, reliable data for major currencies.
 * 
 * @plugin-name ecb-provider
 * @plugin-version 1.0.0
 */

module.exports = {
  name: 'ecb-provider',
  version: '1.0.0',
  description: 'Exchange rates from European Central Bank',
  
  supported_currencies: ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'SGD'],
  
  config_schema: {
    base_url: { type: 'string', required: false, default: 'https://api.exchangerate.host' },
    timeout: { type: 'number', required: false, default: 10000 },
  },

  validateConfig(config) {
    if (config.timeout && config.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }
    return true;
  },

  async fetchRates(currencies, baseCurrency = 'USD') {
    const config = this.config || {};
    const baseUrl = config.base_url || 'https://api.exchangerate.host';
    const timeout = config.timeout || 10000;

    // Build API URL
    const quoteCurrencies = currencies.filter(c => c !== baseCurrency);
    if (quoteCurrencies.length === 0) {
      return {};
    }

    const symbols = quoteCurrencies.join(',');
    const url = `${baseUrl}/latest?base=${baseCurrency}&symbols=${symbols}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      const rates = {};
      for (const currency of quoteCurrencies) {
        if (data.rates[currency]) {
          rates[`${baseCurrency}/${currency}`] = data.rates[currency];
        }
      }

      console.log(`[ECB Provider] Fetched ${Object.keys(rates).length} rates for ${baseCurrency}`);
      return rates;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw new Error(`Failed to fetch rates: ${error.message}`);
    }
  },

  async getLatestRate(from, to) {
    const config = this.config || {};
    const baseUrl = config.base_url || 'https://api.exchangerate.host';
    const timeout = config.timeout || 10000;

    const url = `${baseUrl}/latest?base=${from}&symbols=${to}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rates || !data.rates[to]) {
        throw new Error(`Rate not available for ${from}/${to}`);
      }

      return {
        from,
        to,
        rate: data.rates[to],
        timestamp: new Date(),
        source: this.name,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw new Error(`Failed to fetch rate: ${error.message}`);
    }
  },

  async getRateAtDate(from, to, date) {
    const config = this.config || {};
    const baseUrl = config.base_url || 'https://api.exchangerate.host';
    const timeout = config.timeout || 10000;

    const dateStr = date.toISOString().split('T')[0];
    const url = `${baseUrl}/${dateStr}?base=${from}&symbols=${to}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.rates || !data.rates[to]) {
        throw new Error(`Rate not available for ${from}/${to} on ${dateStr}`);
      }

      return {
        from,
        to,
        rate: data.rates[to],
        timestamp: date,
        source: this.name,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw new Error(`Failed to fetch historical rate: ${error.message}`);
    }
  },

  async testConnection() {
    const result = await this.fetchRates(['EUR', 'GBP'], 'USD');
    return {
      success: Object.keys(result).length > 0,
      rates: result,
    };
  },

  getHealthStatus() {
    return {
      status: 'healthy',
      last_check: new Date().toISOString(),
      provider: this.name,
      version: this.version,
    };
  },
};
