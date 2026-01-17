/**
 * CoinGecko Cryptocurrency Exchange Rate Provider
 * 
 * Fetches cryptocurrency prices from CoinGecko API.
 * Free tier available with rate limits.
 * 
 * @plugin-name coingecko-provider
 * @plugin-version 1.0.0
 */

module.exports = {
  name: 'coingecko-provider',
  version: '1.0.0',
  description: 'Cryptocurrency prices from CoinGecko',
  
  supported_currencies: [
    'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'USDC', 'ADA', 'AVAX', 'DOGE',
    'DOT', 'TRX', 'LINK', 'MATIC', 'SHIB', 'LTC', 'UNI', 'ATOM', 'XMR', 'ETC'
  ],
  
  id_mapping: {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'TRX': 'tron',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'SHIB': 'shiba-inu',
    'LTC': 'litecoin',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'XMR': 'monero',
    'ETC': 'ethereum-classic',
  },

  config_schema: {
    api_key: { type: 'string', required: false },
    timeout: { type: 'number', required: false, default: 15000 },
    vs_currency: { type: 'string', required: false, default: 'usd' },
  },

  validateConfig(config) {
    if (config.timeout && config.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }
    return true;
  },

  async fetchRates(currencies, baseCurrency = 'USD') {
    const config = this.config || {};
    const timeout = config.timeout || 15000;
    const vsCurrency = (config.vs_currency || 'usd').toLowerCase();

    const cryptoCurrencies = currencies.filter(c => this.supported_currencies.includes(c));
    if (cryptoCurrencies.length === 0) {
      return {};
    }

    const ids = cryptoCurrencies
      .map(c => this.id_mapping[c])
      .filter(Boolean)
      .join(',');

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vsCurrency}`;

    const headers = {};
    if (config.api_key) {
      headers['x-cg-api-key'] = config.api_key;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const rates = {};
      for (const currency of cryptoCurrencies) {
        const coinId = this.id_mapping[currency];
        if (data[coinId] && data[coinId][vsCurrency]) {
          const rateKey = `${baseCurrency}/${currency}`;
          if (baseCurrency.toUpperCase() === vsCurrency.toUpperCase()) {
            rates[rateKey] = 1 / data[coinId][vsCurrency];
          } else {
            rates[rateKey] = data[coinId][vsCurrency];
          }
        }
      }

      console.log(`[CoinGecko Provider] Fetched ${Object.keys(rates).length} crypto rates`);
      return rates;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw new Error(`Failed to fetch crypto rates: ${error.message}`);
    }
  },

  async testConnection() {
    const result = await this.fetchRates(['BTC', 'ETH'], 'USD');
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
