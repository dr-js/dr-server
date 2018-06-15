import { createLogger } from 'dr-js/module/node/module/Logger'
import { addExitListenerAsync, addExitListenerSync } from 'dr-js/module/node/system/ExitListener'

const EMPTY_FUNC = () => {}

const prefixLoggerTime = ({ add, ...logger }) => ({
  ...logger,
  add: (...args) => add(new Date().toISOString(), ...args)
})

const configureLogger = async ({ pathLogDirectory, prefixLogFile }) => {
  __DEV__ && !pathLogDirectory && console.log('[Logger] output with console.log()')

  const logger = prefixLoggerTime(pathLogDirectory
    ? await createLogger({ pathLogDirectory, prefixLogFile, flags: 'a' }) // append not clear file if name clash
    : { add: console.log, save: EMPTY_FUNC, split: EMPTY_FUNC, end: EMPTY_FUNC }
  )

  addExitListenerAsync((exitState) => {
    __DEV__ && console.log('>> listenerAsync')
    logger.add(`[EXITING] ${JSON.stringify(exitState)}`)
  })

  addExitListenerSync((exitState) => {
    __DEV__ && console.log('>> listenerSync')
    logger.add(`[EXIT] ${JSON.stringify(exitState)}`)
    exitState.error && logger.add(`[EXIT][ERROR] ${exitState.error.stack || exitState.error}`)
    logger.end()
  })

  return logger
}

export { configureLogger }
