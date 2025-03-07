import { Exchange, ExternalCurrency } from '../../src/utils'

import BigNumber from 'bignumber.js'
import { ExchangeAdapterConfig } from '../../src/exchange_adapters/base'
import { baseLogger } from '../../src/default_config'
import {CoingeckoGeneralAdapter} from "../../src/exchange_adapters/coingecko_general";

describe('CoingeckoGeneral adapter', () => {
  let adapter: CoingeckoGeneralAdapter

  const config: ExchangeAdapterConfig = {
    baseCurrency: ExternalCurrency.PLQ,
    baseLogger,
    quoteCurrency: ExternalCurrency.USD,
  }

  beforeEach(() => {
    adapter = new CoingeckoGeneralAdapter(config)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  const validMockTickerJson = {
    id: "planq",
    symbol: "plq",
    name: "Planq",
    web_slug: "planq",
    asset_platform_id: "osmosis",
    market_data: {
      current_price: {
        aed: 0.0118016,
        ars: 3.42,
        aud: 0.00509352,
        bch: 0.00000799,
        bdt: 0.390765,
        bhd: 0.0012112,
        bmd: 0.00321334,
        bnb: 0.00000534,
        brl: 0.01852104,
        btc: 3.5997e-8,
        cad: 0.00459905,
        chf: 0.00282138,
        clp: 2.99,
        cny: 0.02324369,
        czk: 0.074052,
        dkk: 0.02207111,
        dot: 0.00069946,
        eos: 0.00575847,
        eth: 0.00000146,
        eur: 0.00295906,
        gbp: 0.00248691,
        gel: 0.00893308,
        hkd: 0.02497191,
        huf: 1.18,
        idr: 52.17,
        ils: 0.01160393,
        inr: 0.279322,
        jpy: 0.474051,
        krw: 4.64,
        kwd: 0.00098953,
        lkr: 0.950554,
        ltc: 0.00003078,
        mmk: 6.74,
        mxn: 0.065079,
        myr: 0.01418689,
        ngn: 4.84,
        nok: 0.03475984,
        nzd: 0.00561429,
        php: 0.183523,
        pkr: 0.899902,
        pln: 0.01236906,
        rub: 0.285988,
        sar: 0.0120554,
        sek: 0.03249277,
        sgd: 0.00427346,
        thb: 0.108116,
        try: 0.117083,
        twd: 0.105339,
        uah: 0.132624,
        usd: 0.00321334,
        vef: 0.00032175,
        vnd: 81.95,
        xag: 0.00009867,
        xau: 0.0000011,
        xdr: 0.00242959,
        xlm: 0.01070046,
        xrp: 0.00126343,
        yfi: 5.81943e-7,
        zar: 0.058092,
        bits: 0.03599731,
        link: 0.00018733,
        sats: 3.6
      },
      total_volume: {
        aed: 8164.44,
        ars: 2364354,
        aud: 3523.74,
        bch: 5.525882,
        bdt: 270335,
        bhd: 837.92,
        bmd: 2223.01,
        bnb: 3.696878,
        brl: 12813,
        btc: 0.02490322,
        cad: 3181.66,
        chf: 1951.85,
        clp: 2065201,
        cny: 16080.16,
        czk: 51229,
        dkk: 15268.97,
        dot: 483.889,
        eos: 3984,
        eth: 1.012275,
        eur: 2047.1,
        gbp: 1720.46,
        gel: 6179.98,
        hkd: 17275.76,
        huf: 817193,
        idr: 36093391,
        ils: 8027.69,
        inr: 193237,
        jpy: 327952,
        krw: 3210119,
        kwd: 684.57,
        lkr: 657601,
        ltc: 21.294008,
        mmk: 4663881,
        mxn: 45022,
        myr: 9814.6,
        ngn: 3349391,
        nok: 24047,
        nzd: 3884.01,
        php: 126963,
        pkr: 622559,
        pln: 8557.01,
        rub: 197849,
        sar: 8340.02,
        sek: 22479,
        sgd: 2956.41,
        thb: 74795,
        try: 80999,
        twd: 72875,
        uah: 91750,
        usd: 2223.01,
        vef: 222.59,
        vnd: 56695106,
        xag: 68.26,
        xau: 0.761604,
        xdr: 1680.81,
        xlm: 7403,
        xrp: 874.052,
        yfi: 0.40259242,
        zar: 40189,
        bits: 24903,
        link: 129.593,
        sats: 2490322
      },
      last_updated: "2025-03-07T10:56:21.173Z"
    },
  }

  const invalidJsonWithFalseValid = {
    ...validMockTickerJson,
    error: "error",
  }

  describe('parseTicker', () => {
    it('handles a response that matches the documentation', () => {
      const ticker = adapter.parseTicker(validMockTickerJson)
      BigNumber.config({ DECIMAL_PLACES: 10 });
      expect(ticker).toEqual({
        source: Exchange.COINGECKOGENERAL,
        symbol: adapter.standardPairSymbol,
        ask: new BigNumber(0.00321334),
        bid: new BigNumber(0.00321334),
        lastPrice: new BigNumber(0.00321334),
        timestamp: 1741344981173,

        baseVolume: new BigNumber("691806.65600278837595772623"),
        quoteVolume: new BigNumber(2223.01),
      })
    })

    it('throws an error when the valid field in the response is false', () => {
      expect(() => {
        adapter.parseTicker(invalidJsonWithFalseValid)
      }).toThrowError('Coingecko response object contains error field')
    })
  })
})
