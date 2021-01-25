import { resolve, basename } from 'path'
import { strictEqual } from '@dr-js/core/module/common/verify'

import {
  fromRoot, setupRoot, clearRoot,
  SOURCE_DIRECTORY,
  verifyOutputDirectory
} from './archive.test/function'

import {
  check, verify,
  // compress7zAsync, extract7zAsync,
  compressT7zAsync, extractT7zAsync,
  compressAutoAsync, extractAutoAsync,
  repackAsync, repackTarAsync
} from './archive'

const { describe, it, before, after, info = console.log } = global

const TEST_TEMP = fromRoot(`test-${basename(__filename)}`)
const fromTemp = (...args) => resolve(TEST_TEMP, ...args)

before(setupRoot)
after(clearRoot)

describe('Node.Module.Software.npmTar', () => {
  it('check()', () => strictEqual(check(), true))
  it('verify()', verify)

  it('compressT7zAsync() & extractT7zAsync()', async () => {
    info('compressT7zAsync')
    await compressT7zAsync(SOURCE_DIRECTORY, fromTemp('compressT7zAsync/test.t7z'))
    await compressT7zAsync(SOURCE_DIRECTORY, fromTemp('compressT7zAsync/test.tar.7z'))
    info('extractT7zAsync')
    await extractT7zAsync(fromTemp('compressT7zAsync/test.t7z'), fromTemp('extractT7zAsync/test.t7z-extract/'))
    await extractT7zAsync(fromTemp('compressT7zAsync/test.tar.7z'), fromTemp('extractT7zAsync/test.tar.7z-extract/'))
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractT7zAsync/test.t7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractT7zAsync/test.tar.7z-extract/'))
  })

  it('compressAutoAsync() & extractAutoAsync()', async () => {
    info('compressAutoAsync')
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.7z'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.zip'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.tar'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.tgz'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.tar.gz'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.t7z'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.tar.7z'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.txz'))
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('compressAutoAsync/test.tar.xz'))
    info('extractAutoAsync')
    await extractAutoAsync(fromTemp('compressAutoAsync/test.7z'), fromTemp('extractAutoAsync/test.7z-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.zip'), fromTemp('extractAutoAsync/test.zip-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.tar'), fromTemp('extractAutoAsync/test.tar-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.tgz'), fromTemp('extractAutoAsync/test.tgz-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.tar.gz'), fromTemp('extractAutoAsync/test.tar.gz-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.t7z'), fromTemp('extractAutoAsync/test.t7z-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.tar.7z'), fromTemp('extractAutoAsync/test.tar.7z-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.txz'), fromTemp('extractAutoAsync/test.txz-extract/'))
    await extractAutoAsync(fromTemp('compressAutoAsync/test.tar.xz'), fromTemp('extractAutoAsync/test.tar.xz-extract/'))
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.zip-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.tar-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.tgz-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.tar.gz-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.t7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.tar.7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.txz-extract/'))
    await verifyOutputDirectory(fromTemp('extractAutoAsync/test.tar.xz-extract/'))
  })

  it('repackAsync()', async () => {
    info('pack source')
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('repackAsync/test.7z')) // source archive
    info('repackAsync')
    await repackAsync(fromTemp('repackAsync/test.7z'), fromTemp('repackAsync/test-same.7z')) // same type, waste CPU?
    await repackAsync(fromTemp('repackAsync/test.7z'), fromTemp('repackAsync/test.zip'))
    await repackAsync(fromTemp('repackAsync/test.zip'), fromTemp('repackAsync/test.tar'))
    await repackAsync(fromTemp('repackAsync/test.tar'), fromTemp('repackAsync/test.tgz'))
    await repackAsync(fromTemp('repackAsync/test.tgz'), fromTemp('repackAsync/test.tar.gz'))
    await repackAsync(fromTemp('repackAsync/test.tar.gz'), fromTemp('repackAsync/test.t7z'))
    await repackAsync(fromTemp('repackAsync/test.t7z'), fromTemp('repackAsync/test.tar.7z'))
    await repackAsync(fromTemp('repackAsync/test.tar.7z'), fromTemp('repackAsync/test-back.7z'))
    info('extract repack')
    await extractAutoAsync(fromTemp('repackAsync/test-same.7z'), fromTemp('extractRepack/test-same.7z-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test.zip'), fromTemp('extractRepack/test.zip-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test.tar'), fromTemp('extractRepack/test.tar-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test.tgz'), fromTemp('extractRepack/test.tgz-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test.tar.gz'), fromTemp('extractRepack/test.tar.gz-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test.t7z'), fromTemp('extractRepack/test.t7z-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test.tar.7z'), fromTemp('extractRepack/test.tar.7z-extract/'))
    await extractAutoAsync(fromTemp('repackAsync/test-back.7z'), fromTemp('extractRepack/test-back.7z-extract/'))
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractRepack/test-same.7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test.zip-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test.tar-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test.tgz-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test.tar.gz-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test.t7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test.tar.7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepack/test-back.7z-extract/'))
  })

  it('repackTarAsync()', async () => {
    info('pack source')
    await compressAutoAsync(SOURCE_DIRECTORY, fromTemp('repackTarAsync/test.tgz')) // source archive
    info('repackTarAsync')
    await repackTarAsync(fromTemp('repackTarAsync/test.tgz'), fromTemp('repackTarAsync/test-same.tgz')) // same type, waste CPU?
    await repackTarAsync(fromTemp('repackTarAsync/test.tgz'), fromTemp('repackTarAsync/test.t7z'))
    await repackTarAsync(fromTemp('repackTarAsync/test.t7z'), fromTemp('repackTarAsync/test.tar.gz'))
    await repackTarAsync(fromTemp('repackTarAsync/test.tar.gz'), fromTemp('repackTarAsync/test.tar.7z'))
    await repackTarAsync(fromTemp('repackTarAsync/test.tar.7z'), fromTemp('repackTarAsync/test-back.tgz'))
    info('extract repack')
    await extractAutoAsync(fromTemp('repackTarAsync/test-same.tgz'), fromTemp('extractRepackTar/test-same.tgz-extract/'))
    await extractAutoAsync(fromTemp('repackTarAsync/test.t7z'), fromTemp('extractRepackTar/test.t7z-extract/'))
    await extractAutoAsync(fromTemp('repackTarAsync/test.tar.gz'), fromTemp('extractRepackTar/test.tar.gz-extract/'))
    await extractAutoAsync(fromTemp('repackTarAsync/test.tar.7z'), fromTemp('extractRepackTar/test.tar.7z-extract/'))
    await extractAutoAsync(fromTemp('repackTarAsync/test-back.tgz'), fromTemp('extractRepackTar/test-back.tgz-extract/'))
    info('verifyOutputDirectory')
    await verifyOutputDirectory(fromTemp('extractRepackTar/test-same.tgz-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepackTar/test.t7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepackTar/test.tar.gz-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepackTar/test.tar.7z-extract/'))
    await verifyOutputDirectory(fromTemp('extractRepackTar/test-back.tgz-extract/'))
  })
})
