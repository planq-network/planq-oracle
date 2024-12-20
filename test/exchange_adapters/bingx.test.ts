import BigNumber from 'bignumber.js'
import { baseLogger } from '../../src/default_config'
import { ExchangeAdapterConfig } from '../../src/exchange_adapters/base'
import { BingxAdapter } from '../../src/exchange_adapters/bingx'
import { Exchange, ExternalCurrency } from '../../src/utils'

describe('BingxAdapter', () => {
  let bingxAdapter: BingxAdapter
  const config: ExchangeAdapterConfig = {
    baseCurrency: ExternalCurrency.PLQ,
    baseLogger,
    quoteCurrency: ExternalCurrency.USDT,
  }
  beforeEach(() => {
    bingxAdapter = new BingxAdapter(config)
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })
  describe('parseTicker', () => {
    const tickerJson = {timestamp: 1734709128553,data : [{
      symbol: 'PLQ-USDT',
      priceChange: '-0.000461',
      priceChangePercent: '-5.49%',
      lastPrice: '0.007937',
      bidPrice: '0.007937',
      bidQty: '668',
      askPrice: '0.007986',
      askQty: '1159',
      openPrice: '0.008398',
      highPrice: '0.008398',
      lowPrice: '0.007937',
      volume: '32880',
      quoteVolume: '267.93',
      openTime: 1614604599055,
      closeTime: 1614690999055,
      firstId: 850037,
      lastId: 855106,
      count: 5070,
    }]}
    it('handles a response that matches the documentation', () => {
      expect(bingxAdapter.parseTicker(tickerJson)).toEqual({
        source: Exchange.BINGX,
        symbol: bingxAdapter.pairSymbol,
        ask: new BigNumber(0.007986),
        baseVolume: new BigNumber(32880),
        bid: new BigNumber(0.007937),
        high: new BigNumber(0.008398),
        lastPrice: new BigNumber(0.007937),
        low: new BigNumber(0.007937),
        open: new BigNumber(0.008398),
        quoteVolume: new BigNumber(267.93),
        timestamp: 1734709128553,
      })
    })
    // timestamp, bid, ask, lastPrice, baseVolume
    const requiredFields = ['timestamp','data','askPrice', 'bidPrice', 'lastPrice', 'closeTime', 'volume']

    for (const field of Object.keys(tickerJson)) {
      // @ts-ignore
      const { [field]: _removed, ...incompleteTickerJson } = tickerJson
      if (requiredFields.includes(field)) {
        it(`throws an error if ${field} is missing`, () => {
          expect(() => {
            bingxAdapter.parseTicker(incompleteTickerJson)
          }).toThrowError()
        })
      } else {
        it(`parses a ticker if ${field} is missing`, () => {
          expect(() => {
            bingxAdapter.parseTicker(incompleteTickerJson)
          }).not.toThrowError()
        })
      }
    }
  })

  describe('isOrderbookLive', () => {
    // Note: in the real response, these contain much more info. Only relevant
    // fields are included in this test
    const mockCeloUsdInfo = {
      symbol: 'PLQ-USDT',
      status: 1,
      apiStateBuy: true,
      apiStateSell: false,
    }
    const mockOtherInfo = {
      symbol: 'PLQ-USDT',
      status: 1,
      apiStateBuy: true,
      apiStateSell: true,
    }
    const mockStatusJson = {
      data: {symbols: [mockOtherInfo]},
    }

    it('returns false if the symbol is not found', async () => {
      jest.spyOn(bingxAdapter, 'fetchFromApi').mockReturnValue(
        Promise.resolve({
          ...mockStatusJson,
          symbols: [mockOtherInfo, mockOtherInfo, mockOtherInfo],
        })
      )
      expect(await bingxAdapter.isOrderbookLive()).toEqual(false)
    })

    const otherStatuses = [
      'PRE_TRADING',
      'POST_TRADING',
      'END_OF_DAY',
      'HALT',
      'AUCTION_MATCH',
      'BREAK',
    ]
    for (const status of otherStatuses) {
      it(`returns false if the status is ${status}`, async () => {
        jest.spyOn(bingxAdapter, 'fetchFromApi').mockReturnValue(
          Promise.resolve({
            ...mockStatusJson,
            symbols: [mockOtherInfo],
          })
        )
        expect(await bingxAdapter.isOrderbookLive()).toEqual(false)
      })
    }

    it('returns false if isSpotTradingAllowed is false', async () => {
      jest.spyOn(bingxAdapter, 'fetchFromApi').mockReturnValue(
        Promise.resolve({
          ...mockStatusJson,
          symbols: [{ ...mockCeloUsdInfo, apiStateBuy: false }, mockOtherInfo],
        })
      )
      expect(await bingxAdapter.isOrderbookLive()).toEqual(false)
    })

    it('returns false if both LIMIT or MARKET are not present in orderTypes', async () => {
      const invalidOrderTypesResponses = [
        ['LIMIT_MAKER', 'MARKET', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
        ['LIMIT', 'LIMIT_MAKER', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
        ['LIMIT_MAKER', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
      ]
      for (const orderTypes of invalidOrderTypesResponses) {
        jest.spyOn(bingxAdapter, 'fetchFromApi').mockReturnValue(
          Promise.resolve({
            ...mockStatusJson,
            symbols: [{ ...mockCeloUsdInfo, orderTypes }, mockOtherInfo],
          })
        )
        expect(await bingxAdapter.isOrderbookLive()).toEqual(false)
      }
    })

    it('returns true if symbol is found, status === TRADING, isSpotTradingAllowed is true and orderTypes contains both LIMIT and MARKET', async () => {
      jest.spyOn(bingxAdapter, 'fetchFromApi').mockReturnValue(Promise.resolve(mockStatusJson))
      expect(await bingxAdapter.isOrderbookLive()).toEqual(true)
    })
  })
})
