import { BaseExchangeAdapter, ExchangeAdapter, ExchangeDataType, Ticker } from './base'

import { Exchange } from '../utils'

export class BingxAdapter extends BaseExchangeAdapter implements ExchangeAdapter {
  baseApiUrl = 'https://open-api.bingx.com'

  readonly _exchangeName: Exchange = Exchange.BINGX
  // GeoTrust RSA CA 2018 - validity not after: 06/11/2027, 09:23:45 GMT-3
  _certFingerprint256 =
    'A4:FA:00:7C:4F:65:CB:CB:E4:F9:30:97:47:E2:39:47:28:C6:1D:C3:9A:E7:15:7B:33:53:CD:91:A6:22:DF:1A'

  private static readonly tokenSymbolMap = BingxAdapter.standardTokenSymbolMap

  protected generatePairSymbol(): string {
    return `${BingxAdapter.tokenSymbolMap.get(
      this.config.baseCurrency
    )}-${BingxAdapter.tokenSymbolMap.get(this.config.quoteCurrency)}`
  }

  async fetchTicker(): Promise<Ticker> {

    const tickerJson = await this.fetchFromApi(
      ExchangeDataType.TICKER,
      `openApi/spot/v1/ticker/24hr?symbol=${this.pairSymbol}&timestamp=${Date.now()}`
    )
    return this.parseTicker(tickerJson)
  }

  /**
   *
   * @param json parsed response from Binance's ticker endpoint
   *
   * {
   *   "symbol": "PLANQBTC",
   *   "priceChange": "0.00000023",
   *   "priceChangePercent": "0.281",
   *   "weightedAvgPrice": "0.00008154",
   *   "prevClosePrice": "0.00008173",
   *   "lastPrice": "0.00008219",
   *   "lastQty": "7.10000000",
   *   "bidPrice": "0.00008213",
   *   "bidQty": "9.90000000",
   *   "askPrice": "0.00008243",
   *   "askQty": "100.00000000",
   *   "openPrice": "0.00008196",
   *   "highPrice": "0.00008386",
   *   "lowPrice": "0.00007948",
   *   "volume": "155146.90000000",
   *   "quoteVolume": "12.65048684",
   *   "openTime": 1614597075604,
   *   "closeTime": 1614683475604,
   *   "firstId": 849549, // First tradeId
   *   "lastId": 854852, // Last tradeId
   *   "count": 5304 // Trade count
   * }
   */
  parseTicker(json: any): Ticker {
    const ticker = {
      source: Exchange.BINGX,
      symbol: this.pairSymbol,
      ask: this.safeBigNumberParse(json.data[0].askPrice)!,
      baseVolume: this.safeBigNumberParse(json.data[0].volume)!,
      bid: this.safeBigNumberParse(json.data[0].bidPrice)!,
      high: this.safeBigNumberParse(json.data[0].highPrice),
      lastPrice: this.safeBigNumberParse(json.data[0].lastPrice)!,
      low: this.safeBigNumberParse(json.data[0].lowPrice),
      open: this.safeBigNumberParse(json.data[0].openPrice),
      quoteVolume: this.safeBigNumberParse(json.data[0].quoteVolume)!,
      timestamp: this.safeBigNumberParse(json.timestamp)?.toNumber()!,
    }

    this.verifyTicker(ticker)

    return ticker
  }

  async isOrderbookLive(): Promise<boolean> {
    const res = await this.fetchFromApi(ExchangeDataType.ORDERBOOK_STATUS, `openApi/spot/v1/common/symbols?symbol=${this.pairSymbol}`)

    const marketInfo = (res?.data?.symbols as {
      status: number
      symbol: string
      apiStateBuy: boolean
      apiStateSell: boolean
    }[])?.find((info) => info?.symbol === this.pairSymbol)

    return (
      !!marketInfo &&
      marketInfo.status === 1 &&
      marketInfo.apiStateBuy &&
      marketInfo.apiStateSell
    )
  }
}
