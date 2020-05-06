import { resolve } from 'path'
import { isString, isBasicObject } from '@dr-js/core/module/common/check'
import { Preset } from '@dr-js/core/module/node/module/Option/preset'

import { parseHostString } from 'source/module/ServerPack'

const { parseCompact, parseCompactList } = Preset

const getServerPackFormatConfig = (extraList = []) => parseCompact('host,H/SS,O|set "hostname:port"', [
  parseCompact(`TLS-SNI-config/SO,O|TLS SNI config map, set to enable https:\n  ${[
    'multi config: { [hostname]: { key: pathOrBuffer, cert: pathOrBuffer, ca: pathOrBuffer } }, default to special hostname "default", or the first config',
    'single config: { key: pathOrBuffer, cert: pathOrBuffer, ca: pathOrBuffer }',
    'key: Private keys in PEM format',
    'cert: Cert chains in PEM format',
    'ca: Optionally override the trusted CA certificates'
  ].join('\n  ')}`, parseCompactList(
    'TLS-dhparam/O/1|pathOrBuffer; Diffie-Hellman Key Exchange, generate with: "openssl dhparam -dsaparam -outform PEM -out output/path/dh4096.pem 4096"'
  )),
  ...extraList
])

const getServerPackOption = ({ tryGet, tryGetFirst, pwd }, defaultHostname = '127.0.0.1') => {
  const host = tryGetFirst('host') || ''
  const { hostname, port } = parseHostString(host, defaultHostname)
  const pwdTLSSNIConfig = pwd('TLS-SNI-config') // should be the same for `TLS-dhparam`
  const autoResolve = (value) => isString(value) ? resolve(pwdTLSSNIConfig, value) : value
  return {
    protocol: tryGet('TLS-SNI-config') ? 'https:' : 'http:',
    hostname, port,
    ...(pwdTLSSNIConfig && {
      TLSSNIConfig: objectMapDeep(tryGetFirst('TLS-SNI-config'), autoResolve),
      TLSDHParam: autoResolve(tryGetFirst('TLS-dhparam'))
    })
  }
}
const objectMapDeep = (object, mapFunc) => {
  const result = {}
  for (const [ key, value ] of Object.entries(object)) result[ key ] = (isBasicObject(value) && !Buffer.isBuffer(value)) ? objectMapDeep(value, mapFunc) : mapFunc(value, key)
  return result
}

const LogFormatConfig = parseCompact('log-path/SP,O', parseCompactList(
  'log-file-prefix/SS,O'
))
const getLogOption = ({ tryGetFirst }) => ({
  pathLogDirectory: tryGetFirst('log-path'),
  logFilePrefix: tryGetFirst('log-file-prefix')
})

const PidFormatConfig = parseCompact('pid-file/SP,O', parseCompactList(
  'pid-ignore-exist/T'
))
const getPidOption = ({ tryGet, tryGetFirst }) => ({
  filePid: tryGetFirst('pid-file'),
  shouldIgnoreExistPid: Boolean(tryGet('pid-ignore-exist'))
})

export {
  getServerPackFormatConfig, getServerPackOption,

  LogFormatConfig, getLogOption,
  PidFormatConfig, getPidOption
}
