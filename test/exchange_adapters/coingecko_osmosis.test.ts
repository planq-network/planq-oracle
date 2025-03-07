import { Exchange, ExternalCurrency } from '../../src/utils'

import BigNumber from 'bignumber.js'
import { ExchangeAdapterConfig } from '../../src/exchange_adapters/base'
import { baseLogger } from '../../src/default_config'
import {CoingeckoOsmosisAdapter} from "../../src/exchange_adapters/coingecko_osmosis";

describe('CoingeckoOsmosis adapter', () => {
  let adapter: CoingeckoOsmosisAdapter

  const config: ExchangeAdapterConfig = {
    baseCurrency: ExternalCurrency.PLQ,
    baseLogger,
    quoteCurrency: ExternalCurrency.USD,
  }

  beforeEach(() => {
    adapter = new CoingeckoOsmosisAdapter(config)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  const validMockTickerJson = {
    name: "Planq",
    tickers: [
      {
        base: "IBC/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4",
        target: "IBC/B1E0166EA0D759FDF4B207D1F5F12210D8BFE36F2345CEFC76948CE2B36DFBAF",
        market: {
          name: "Osmosis",
          identifier: "osmosis",
          has_trading_incentive: false
        },
        last: 327.48186599106293,
        volume: 327.91697600101764,
        converted_last: {
          btc: 3.4068e-8,
          eth: 0.00000138,
          usd: 0.00304902
        },
        converted_volume: {
          btc: 0.00365841,
          eth: 0.14870899,
          usd: 327.42
        },
        trust_score: "green",
        bid_ask_spread_percentage: 0.691217,
        timestamp: "2025-03-05T13:01:15+00:00",
        last_traded_at: "2025-03-05T13:01:15+00:00",
        last_fetch_at: "2025-03-05T13:43:14+00:00",
        is_anomaly: false,
        is_stale: false,
        trade_url: "https://app.osmosis.zone/?from=ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4&to=ibc/B1E0166EA0D759FDF4B207D1F5F12210D8BFE36F2345CEFC76948CE2B36DFBAF",
        token_info_url: null,
        coin_id: "bridged-usdc",
        target_coin_id: "planq"
      }
    ]
  }

  const invalidJsonWithFalseValid = {
    ...validMockTickerJson,
    error: "error",
  }

  const invalidJsonWithInvalidFrom = {
    ...validMockTickerJson,
    tickers: {
      ...validMockTickerJson.tickers,
      from: 'USD',
    },
  }

  const invalidJsonWithInvalidTo = {
    ...validMockTickerJson,
    tickers: {
      ...validMockTickerJson.tickers,
      to: 'USD',
    },
  }

  describe('parseTicker', () => {
    it('handles a response that matches the documentation', () => {
      const ticker = adapter.parseTicker(validMockTickerJson)

      expect(ticker).toEqual({
        source: Exchange.COINGECKOOSMOSIS,
        symbol: adapter.standardPairSymbol,
        ask: new BigNumber(0.00304902),
        bid: new BigNumber(0.00304902),
        lastPrice: new BigNumber(0.00304902),
        timestamp: 1741182194000,
        baseVolume: new BigNumber(327.91697600101764).toNumber(),
        quoteVolume: new BigNumber(327.42).toNumber(),
      })
    })

    it('throws an error when the valid field in the response is false', () => {
      expect(() => {
        adapter.parseTicker(invalidJsonWithFalseValid)
      }).toThrowError('Coingecko response object contains error field')
    })

    it('throws an error when the from field in the response is not the base currency', () => {
      expect(() => {
        adapter.parseTicker(invalidJsonWithInvalidFrom)
      }).toThrowError('Coingecko response object ticker length is not bigger than 0')
    })

    it('throws an error when the to field in the response is not the quote currency', () => {
      expect(() => {
        adapter.parseTicker(invalidJsonWithInvalidTo)
      }).toThrowError('Coingecko response object ticker length is not bigger than 0')
    })
  })
})
