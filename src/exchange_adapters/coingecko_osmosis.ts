import { BaseExchangeAdapter, ExchangeAdapter, ExchangeDataType, Ticker } from './base'

import { Exchange } from '../utils'
import { strict as assert } from 'assert'

export class CoingeckoOsmosisAdapter extends BaseExchangeAdapter implements ExchangeAdapter {
  baseApiUrl = 'https://pro-api.coingecko.com/api/v3/coins'
  readonly _exchangeName: Exchange = Exchange.COINGECKOOSMOSIS
  // E1 - validity not after: 15/09/2025, 13:00:00 GMT-3
  readonly _certFingerprint256 =
    '0E:58:19:FB:A8:CF:BE:1A:1F:3A:16:6D:BD:0A:3B:B5:BD:70:DC:71:72:DF:FD:45:C8:FC:93:F2:A8:E8:85:25'

  protected generatePairSymbol(): string {
    const base = CoingeckoOsmosisAdapter.standardTokenSymbolMap.get(this.config.baseCurrency)
    const quote = CoingeckoOsmosisAdapter.standardTokenSymbolMap.get(this.config.quoteCurrency)

    return `${base}${quote}`
  }

  async fetchTicker(): Promise<Ticker> {
    assert(this.config.apiKey !== undefined, 'Coingecko API key was not set')

    const base = this.config.baseCurrency

    const tickerJson: Response = await this.fetchFromApi(
      ExchangeDataType.TICKER,
      `/${base}/tickers?exchange_ids=osmosis&x_cg_pro_api_key=${this.config.apiKey}`
    )
    return this.parseTicker(tickerJson)
  }

  /**
   *
   * @param json parsed response from Coingecko latest endpoint
   * {
   *   "name": "Planq",
   *   "tickers": [
   *     {
   *       "base": "IBC/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4",
   *       "target": "IBC/B1E0166EA0D759FDF4B207D1F5F12210D8BFE36F2345CEFC76948CE2B36DFBAF",
   *       "market": {
   *         "name": "Osmosis",
   *         "identifier": "osmosis",
   *         "has_trading_incentive": false
   *       },
   *       "last": 327.48186599106293,
   *       "volume": 327.91697600101764,
   *       "converted_last": {
   *         "btc": 3.4068e-8,
   *         "eth": 0.00000138,
   *         "usd": 0.00304902
   *       },
   *       "converted_volume": {
   *         "btc": 0.00365841,
   *         "eth": 0.14870899,
   *         "usd": 327.42
   *       },
   *       "trust_score": "green",
   *       "bid_ask_spread_percentage": 0.691217,
   *       "timestamp": "2025-03-05T13:01:15+00:00",
   *       "last_traded_at": "2025-03-05T13:01:15+00:00",
   *       "last_fetch_at": "2025-03-05T13:43:14+00:00",
   *       "is_anomaly": false,
   *       "is_stale": false,
   *       "trade_url": "https://app.osmosis.zone/?from=ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4&to=ibc/B1E0166EA0D759FDF4B207D1F5F12210D8BFE36F2345CEFC76948CE2B36DFBAF",
   *       "token_info_url": null,
   *       "coin_id": "bridged-usdc",
   *       "target_coin_id": "planq"
   *     },
   *     {
   *       "base": "IBC/B1E0166EA0D759FDF4B207D1F5F12210D8BFE36F2345CEFC76948CE2B36DFBAF",
   *       "target": "UOSMO",
   *       "market": {
   *         "name": "Osmosis",
   *         "identifier": "osmosis",
   *         "has_trading_incentive": false
   *       },
   *       "last": 0.010695000251402622,
   *       "volume": 58091.60250071979,
   *       "converted_last": {
   *         "btc": 3.4068e-8,
   *         "eth": 0.00000138,
   *         "usd": 0.00304902
   *       },
   *       "converted_volume": {
   *         "btc": 0.00197904,
   *         "eth": 0.08044507,
   *         "usd": 177.12
   *       },
   *       "trust_score": "yellow",
   *       "bid_ask_spread_percentage": 0.721229,
   *       "timestamp": "2025-03-05T13:01:13+00:00",
   *       "last_traded_at": "2025-03-05T13:01:13+00:00",
   *       "last_fetch_at": "2025-03-05T13:43:13+00:00",
   *       "is_anomaly": false,
   *       "is_stale": false,
   *       "trade_url": "https://app.osmosis.zone/?from=ibc/B1E0166EA0D759FDF4B207D1F5F12210D8BFE36F2345CEFC76948CE2B36DFBAF&to=uosmo",
   *       "token_info_url": null,
   *       "coin_id": "planq",
   *       "target_coin_id": "osmosis"
   *     }
   *   ]
   * }
   */
  parseTicker(json: any): Ticker {
    assert(json.error === undefined, 'Coingecko response object contains error field')
    assert(json.tickers.length > 0, 'Coingecko response object ticker length is not bigger than 0')

    assert(
      json.tickers[0].converted_last[this.config.quoteCurrency.toLocaleLowerCase()] !== undefined,
      'CurrencyApi response object to field does not match quote currency'
    )
    const tickerJson = json.tickers[0]
    const price = this.safeBigNumberParse(tickerJson.converted_last[this.config.quoteCurrency.toLocaleLowerCase()])!
    const ticker = {
      ...this.priceObjectMetadata,
      ask: price,
      bid: price,
      lastPrice: price,
      timestamp: this.safeDateParse(tickerJson.last_fetch_at)!,
      baseVolume: tickerJson.volume,
      quoteVolume: tickerJson.converted_volume[this.config.quoteCurrency.toLocaleLowerCase()],
    }
    this.verifyTicker(ticker)
    return ticker
  }

  async isOrderbookLive(): Promise<boolean> {
    return true
  }
}
