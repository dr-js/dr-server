import { dirname } from 'path'
import { unlinkSync, readFileSync, writeFileSync } from 'fs'
import { catchSync } from '@dr-js/core/module/common/error'

import { createDirectory } from '@dr-js/core/module/node/file/Directory'
import { addExitListenerSync } from '@dr-js/core/module/node/system/ExitListener'
import { isPidExist } from '@dr-js/core/module/node/system/Process'

const configurePid = async ({
  filePid, // if not set, will skip create pid file
  shouldIgnoreExistPid = false
} = {}) => {
  if (!filePid) return

  __DEV__ && !shouldIgnoreExistPid && console.log('check existing pid file', filePid)
  !shouldIgnoreExistPid && catchSync(() => {
    const existingPid = Number(String(readFileSync(filePid)).trim())
    if (!existingPid || !isPidExist(existingPid)) return // allow skip invalid/malformed or un-exist pid

    // NOTE: this will actually exit the process
    console.warn(`[Pid] get existing pid: ${existingPid}, exit process...`)
    process.exit(-1)
  })

  __DEV__ && console.log('create pid file', filePid)
  await createDirectory(dirname(filePid))
  writeFileSync(filePid, `${process.pid}`)

  addExitListenerSync((exitState) => {
    __DEV__ && console.log('delete pid file', filePid, exitState)
    catchSync(unlinkSync, filePid)
  })
}

export { configurePid }
