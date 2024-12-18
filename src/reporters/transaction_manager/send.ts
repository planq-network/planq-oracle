import {ethers, Transaction} from 'ethers'
import Logger from 'bunyan'
import { TransactionReceipt } from 'web3-core'

/**
 * Sends a transaction wrapped by the metricAction. Gas is estimated--
 * in the event that gas estimation fails due to this race condition:
 * Which can be identified
 * by gas estimation failing but the subsequent eth_call done by contractkit not
 * indicating a revert, fallbackGas is used.
 * @param provider the web3 provider
 * @param tx the transaction to send
 * @param gasPrice the gas price for the transaction
 * @param from the from address for the transaction
 * @param metricAction a function that wraps the sending of the tx, intended to record any metrics
 * @param fallbackGas the fallback gas to use in the event gas estimation incorrectly fails
 */
export default async function send(
  logger: Logger,
  provider: ethers.providers.Provider,
  tx: ethers.Transaction<void>,
  gasPrice: number,
  from: string,
  metricAction: <T>(fn: () => Promise<T>, action: string) => Promise<T>,
  fallbackGas: number
) {
  const txResult = await metricAction(async () => {
    try {
      // First, attempt to send transaction without a gas amount to have
      // contractkit estimate gas
      tx.from = from
      tx.gasPrice = gasPrice
      return await provider.sendTransaction(tx)
    } catch (err: any) {
      // If anything fails, the error is caught here.
      // We seek the case where gas estimation has failed but the subsequent
      // eth_call made by contractkit to get the revert reason has not given
      // a revert reason. In this situation, the following string will be
      // included in the error string: 'Gas estimation failed: Could not decode transaction failure reason'
      if (
        err.message.includes(
          'Gas estimation failed: Could not decode transaction failure reason'
        ) &&
        fallbackGas !== undefined
      ) {
        logger.info(
          {
            tx,
            gasPrice,
            from,
            fallbackGas,
            err,
          },
          'Gas estimation failed but eth_call did not, using fallback gas'
        )
        // Retry with the fallbackGas to avoid gas estimation
        tx.from = from
        tx.gasPrice = gasPrice
        tx.gasLimit = fallbackGas
        return await provider.sendTransaction(tx)
      }
      // If there was a legitimate error, we still throw
      throw err
    }
  }, 'send')
  return metricAction<TransactionReceipt>(() => txResult.waitReceipt(), 'waitReceipt')
}
