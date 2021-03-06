import { resolve } from 'path'
import { writeFileSync } from 'fs'
import {
  cachedDataVersionTag,
  getHeapSpaceStatistics,
  getHeapStatistics,
  getHeapSnapshot,
  getHeapCodeStatistics,
  writeHeapSnapshot
} from 'v8'

import { getRandomId } from '@dr-js/core/module/common/math/random'
import { createDirectory } from '@dr-js/core/module/node/file/Directory'

const getV8Extra = () => ({
  date: new Date().toISOString(),
  cachedDataVersionTag: cachedDataVersionTag(),
  heapSpaceStatistics: getHeapSpaceStatistics(),
  heapStatistics: getHeapStatistics(),
  heapCodeStatistics: getHeapCodeStatistics()
})

const getV8HeapSnapshotReadableStream = getHeapSnapshot // should pipe to some file
const writeV8HeapSnapshot = writeHeapSnapshot // should pipe to some file

const dumpAsync = async (path) => {
  await createDirectory(path)
  const tag = getRandomId()
  // all sync may cause main thread block
  writeV8HeapSnapshot(resolve(path, `runtime-dump-${tag}.heapsnapshot`))
  writeFileSync(resolve(path, `runtime-dump-${tag}.extra.json`), JSON.stringify(getV8Extra()))
}

const setupSIGUSR2 = (outputPath) => { // linux only
  outputPath = resolve(outputPath)
  // console.log(`[setupSIGUSR2] outputPath: "${outputPath}"`)
  const listener = () => dumpAsync(outputPath)
  process.on('SIGUSR2', listener)
  return () => process.off('SIGUSR2', listener)
}

export {
  getV8Extra,
  getV8HeapSnapshotReadableStream,
  writeV8HeapSnapshot,
  dumpAsync,
  setupSIGUSR2
}
