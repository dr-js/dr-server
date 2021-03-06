import { binary } from '@dr-js/core/module/common/format'
import { isString, isBasicFunction } from '@dr-js/core/module/common/check'
import { run } from '@dr-js/core/module/node/run'
import { describeSystemStatus } from '@dr-js/core/module/node/system/Status'

// TODO: allow user change || overwrite commands

const IS_WIN32 = process.platform === 'win32'
const IS_DARWIN = process.platform === 'darwin'

const COMMON_SERVER_STATUS_COMMAND_LIST = [
  // [ title, ...tryList ]
  [ 'Disk', async (rootPath) => {
    if (IS_WIN32) { // win32 alternative, sample stdout: `27 Dir(s)  147,794,321,408 bytes free`
      const freeByteString = (await runQuick('dir | find "bytes free"', rootPath))
        .match(/([\d,]+) bytes/)[ 1 ]
        .replace(/\D/g, '')
      return `${binary(Number(freeByteString))}B free storage`
    } else {
      const diskStatus = await runQuick('df -h .', rootPath)
      if (!diskStatus.includes('/dev/')) return diskStatus // on remote-mount fs, skip `du` check (may be slow)
      return [ diskStatus, 'Usage', await runQuick('du -hd1', rootPath) ].join('\n')
    }
  } ],
  !IS_WIN32 && [ 'Network', 'vnstat -s' ],
  [ 'System', IS_DARWIN ? 'top -l1 -n0' : 'top -bn1 | head -n5', () => describeSystemStatus() ],
  [ 'Time', () => new Date().toISOString() ]
].filter(Boolean)

const runQuick = async (command, rootPath) => {
  const { promise, stdoutPromise } = run([ command ], { cwd: rootPath, shell: true, quiet: true, describeError: true })
  await promise
  return String(await stdoutPromise)
}

const runStatusCommand = async (statusCommand, rootPath) => {
  let output = ''
  if (isString(statusCommand)) output = await runQuick(statusCommand, rootPath)
  else if (isBasicFunction(statusCommand)) output = await statusCommand(rootPath)
  return output
}

const getCommonServerStatus = async (rootPath, statusCommandList = COMMON_SERVER_STATUS_COMMAND_LIST) => {
  const resultList = []
  for (const [ title, ...tryList ] of statusCommandList) {
    let output = ''
    for (const statusCommand of tryList) {
      output = await runStatusCommand(statusCommand, rootPath).catch(() => '')
      if (output) break
    }
    resultList.push([ title, output ])
  }
  return resultList
}

export {
  COMMON_SERVER_STATUS_COMMAND_LIST,
  getCommonServerStatus
}
