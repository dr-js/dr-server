import { unlinkSync, readFileSync } from 'fs'
import { dirname } from 'path'
import { catchSync } from 'dr-js/module/common/error'
import { writeFileAsync } from 'dr-js/module/node/file/function'
import { createDirectory } from 'dr-js/module/node/file/File'
import { addExitListenerSync } from 'dr-js/module/node/system/ExitListener'

const configurePid = async ({
  filePid,
  shouldIgnoreExistPid = false
}) => {
  if (!filePid) return

  __DEV__ && !shouldIgnoreExistPid && console.log('check existing pid file', filePid)
  !shouldIgnoreExistPid && catchSync(() => {
    const existingPid = String(readFileSync(filePid))
    if (!existingPid) return
    console.warn(`[Pid] get existing pid: ${existingPid}, exit process...`)
    return process.exit(-1)
  })

  __DEV__ && console.log('create pid file', filePid)
  await createDirectory(dirname(filePid))
  await writeFileAsync(filePid, `${process.pid}`)

  addExitListenerSync((exitState) => {
    __DEV__ && console.log('delete pid file', filePid, exitState)
    catchSync(unlinkSync, filePid)
  })
}

export { configurePid }