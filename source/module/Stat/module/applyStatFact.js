import { setSumRaw, setRangeRaw, combineStatRaw, combineStat } from './combineStat'

const DAY_IN_SECOND = __DEV__
  ? 8 // much faster for dev
  : 24 * 60 * 60

const MERGE_TIME_0 = DAY_IN_SECOND
const MERGE_TIME_1 = DAY_IN_SECOND * (__DEV__ ? 4 : 7)
const MERGE_TIME_2 = DAY_IN_SECOND * (__DEV__ ? 4 * 4 : 7 * 5)

const SPLIT_TIME_0 = DAY_IN_SECOND / (__DEV__ ? 2 * 2 : 24 * 3) // per 20min
const SPLIT_TIME_1 = DAY_IN_SECOND / (__DEV__ ? 2 : 24) // per hour
const SPLIT_TIME_2 = DAY_IN_SECOND // per day

const MERGE_2_MAX_COUNT = 256

const floorTimestampByDay = (timestamp) => Math.floor(timestamp / DAY_IN_SECOND) * DAY_IN_SECOND

const getStartState = (timestamp) => ({
  id: 1,
  timestamp,
  sumKeyList: [],
  rangeKeyList: [],
  statRawList: [], // per 5min stat for 1 day // estimate length = 24 * 60 / 5 = 288
  statRawTimestamp: floorTimestampByDay(timestamp) + MERGE_TIME_0,
  merge0List: [], // per 20min stat for 7 days // estimate length = 7 * 24 * 60 / 20 = 504
  merge0Timestamp: floorTimestampByDay(timestamp) + MERGE_TIME_1,
  merge1List: [], // per hour stat for 35 days // estimate length = 35 * 24 = 840
  merge1Timestamp: floorTimestampByDay(timestamp) + MERGE_TIME_2,
  merge2List: [] // per day stat // length = Infinite
})

const parseStat = ({ timestamp, error, retryCount, stat, timeOk, timeDownload }, sumKeyList, rangeKeyList) => {
  const sumRawList = []
  const rangeRawList = []
  rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'timestamp', timestamp) // TODO: may be not good for timestamp to have valueSize = 1
  if (error) {
    sumKeyList = setSumRaw(sumKeyList, sumRawList, 'error', 1)
  } else {
    const { timestamp: timestampStat, systemStat, processStat, delta } = stat
    sumKeyList = setSumRaw(sumKeyList, sumRawList, 'retryCount', retryCount)
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'timeOk', timeOk)
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'timeDownload', timeDownload)
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'timestampStat', timestampStat)
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'systemMemoryUsed', calcSystemMemoryUsed(systemStat.memory))
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'processMemoryRSS', processStat.memoryUsage.rss)
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'processMemoryHeap', processStat.memoryUsage.heapTotal)
    delta.systemProcessorTimeList.forEach((systemProcessorTime, index) => {
      rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, `systemProcessorUsed[${index}]`, calcSystemProcessorUsed(systemProcessorTime), delta.time)
    })
    rangeKeyList = setRangeRaw(rangeKeyList, rangeRawList, 'processProcessorUsed', calcProcessProcessorUsed(delta.processCpuUsage, delta.time), delta.time)
  }
  return [ { sumRawList, rangeRawList }, sumKeyList, rangeKeyList ]
}
const calcSystemMemoryUsed = ({ free, total }) => (total - free) / total
const calcSystemProcessorUsed = ({ user, nice, sys, idle, irq }) => {
  const nonIdle = user + nice + sys + irq
  return nonIdle / (idle + nonIdle)
}
const calcProcessProcessorUsed = ({ user, system }, deltaTime) => (user + system) * 0.001 / deltaTime

const splitChunk = (inputList, deltaTime, endTime, getTimeFunc, mergeFunc) => {
  if (!inputList.length) return [ inputList, [] ]

  const outputList = []
  const indexMax = inputList.length
  let index = 0
  let chunkIndex = 0
  let splitTime = Math.floor(getTimeFunc(inputList[ 0 ]) / deltaTime) * deltaTime
  // __DEV__ && console.log('>> delta:', deltaTime, ' endTime:', endTime, '#', inputList.length, '[', getTimeFunc(inputList[ 0 ]), '-', getTimeFunc(inputList[ inputList.length - 1 ]), ']')

  while (index < indexMax) {
    const currentItemTime = getTimeFunc(inputList[ index ])
    if (currentItemTime < splitTime) {
      // __DEV__ && chunkIndex !== index && console.log('  splitAt:', splitTime, '#', index - chunkIndex, '[', getTimeFunc(inputList[ chunkIndex ]), chunkIndex, '-', getTimeFunc(inputList[ index - 1 ]), index - 1, ']')
      chunkIndex !== index && outputList.push(mergeFunc(inputList.slice(chunkIndex, index)))
      chunkIndex = index
      if (currentItemTime < endTime) {
        // __DEV__ && console.log('  break at endTime:', endTime)
        break
      }
      splitTime = Math.max(Math.floor(currentItemTime / deltaTime) * deltaTime, endTime)
    }
    index++
  }
  if (index !== chunkIndex) { // has extra chunk
    // __DEV__ && console.log('  extra splitAt:', splitTime, '#', index - chunkIndex, '[', getTimeFunc(inputList[ chunkIndex ]), chunkIndex, '-', getTimeFunc(inputList[ index - 1 ]), index - 1, ']')
    outputList.push(mergeFunc(inputList.slice(chunkIndex, index)))
    chunkIndex = index
  }

  const clippedInputList = inputList.slice(0, chunkIndex)
  // __DEV__ && console.log('<< #outputList:', outputList.length, '#clipped:', inputList.length - clippedInputList.length, ' exit index:', chunkIndex, index)
  return [ clippedInputList, outputList ]
}

const applyStatFact = (state, fact) => {
  const { id, timestamp } = fact

  if (id === 1) state = getStartState(timestamp) // TODO: better way for start state with init fact
  __DEV__ && id === 1 && console.log('[applyFact] replaced fact state:', state)

  let { sumKeyList, rangeKeyList, statRawList, statRawTimestamp, merge0Timestamp, merge1Timestamp } = state

  if (timestamp >= statRawTimestamp) {
    const rangeTimestampIndex = rangeKeyList.indexOf('timestamp')
    const rawRangeValueIndex = 0
    const getRawStatTimeFunc = (statRaw) => statRaw.rangeRawList[ rangeTimestampIndex ][ rawRangeValueIndex ]

    const [ clippedInputList, outputList ] = splitChunk(statRawList, SPLIT_TIME_0, statRawTimestamp - MERGE_TIME_0, getRawStatTimeFunc, combineStatRaw)
    statRawList = clippedInputList
    let merge0List = [ ...outputList, ...state.merge0List ]

    if (timestamp >= merge0Timestamp) {
      const rangeValueMaxIndex = 1
      const getMergeStatTimeFunc = (mergeStat) => mergeStat.rangeList[ rangeTimestampIndex ][ rangeValueMaxIndex ]

      const [ clippedInputList, outputList ] = splitChunk(merge0List, SPLIT_TIME_1, merge0Timestamp - MERGE_TIME_1, getMergeStatTimeFunc, combineStat)
      merge0List = clippedInputList
      let merge1List = [ ...outputList, ...state.merge1List ]

      if (timestamp >= merge1Timestamp) {
        const [ clippedInputList, outputList ] = splitChunk(merge1List, SPLIT_TIME_2, merge1Timestamp - MERGE_TIME_2, getMergeStatTimeFunc, combineStat)
        merge1List = clippedInputList
        const merge2List = [ ...outputList, ...state.merge2List ]
        if (merge2List.length > MERGE_2_MAX_COUNT) merge2List.length = MERGE_2_MAX_COUNT

        state = { ...state, merge2List, merge1Timestamp: floorTimestampByDay(timestamp) + MERGE_TIME_2 }
        __DEV__ && console.log('## pass merge1Timestamp', merge2List.length, timestamp, state.merge1Timestamp)
      }

      state = { ...state, merge1List, merge0Timestamp: floorTimestampByDay(timestamp) + MERGE_TIME_1 }
      __DEV__ && console.log('## pass merge0Timestamp', merge1List.length, timestamp, state.merge0Timestamp)
    }

    state = { ...state, sumKeyList, rangeKeyList, merge0List, statRawTimestamp: floorTimestampByDay(timestamp) + MERGE_TIME_0 }
    __DEV__ && console.log('## pass statRawTimestamp', merge0List.length, timestamp, state.statRawTimestamp)
  }

  const [ statRaw, nextSumKeyList, nextRangeKeyList ] = parseStat(fact, sumKeyList, rangeKeyList)

  return { ...state, id, timestamp, sumKeyList: nextSumKeyList, rangeKeyList: nextRangeKeyList, statRawList: [ statRaw, ...statRawList ] }
}

export { applyStatFact }
