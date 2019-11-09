import { createRequestListener } from '@dr-js/core/module/node/server/Server'
import { responderEnd, responderEndWithStatusCode, responderEndWithRedirect, createResponderLog, createResponderLogEnd } from '@dr-js/core/module/node/server/Responder/Common'
import { createResponderFavicon } from '@dr-js/core/module/node/server/Responder/Send'
import { createResponderRouter, createRouteMap, createResponderRouteListHTML } from '@dr-js/core/module/node/server/Responder/Router'

import { configureFeaturePack as configureFeaturePackAuth } from '@dr-js/node/module/server/feature/Auth/configureFeaturePack'
import { configureFeaturePack as configureFeaturePackPermission } from '@dr-js/node/module/server/feature/Permission/configureFeaturePack'
import { configureFeaturePack as configureFeaturePackExplorer } from '@dr-js/node/module/server/feature/Explorer/configureFeaturePack'
import { configureFeaturePack as configureFeaturePackStatCollect } from '@dr-js/node/module/server/feature/StatCollect/configureFeaturePack'
import { configureFeaturePack as configureFeaturePackStatReport } from '@dr-js/node/module/server/feature/StatReport/configureFeaturePack'
import { configureFeaturePack as configureFeaturePackTaskRunner } from '@dr-js/node/module/server/feature/TaskRunner/configureFeaturePack'

const configureSampleServer = async ({
  serverPack: { server, option }, logger, routePrefix = '',

  // auth
  authSkip = false,
  authFile,
  authFileGroupPath, authFileGroupDefaultTag, authFileGroupKeySuffix,
  // permission
  permissionType, permissionFunc, permissionFile,

  // explorer
  explorerRootPath, explorerUploadMergePath, explorerStatusCommandList,
  // stat collect
  statCollectPath, statCollectUrl, statCollectInterval,
  // stat report
  statReportProcessTag,
  // task-runner
  taskRunnerRootPath
}) => {
  const URL_AUTH_CHECK = '/auth'

  const featureAuth = await configureFeaturePackAuth({
    logger, routePrefix,
    authSkip,
    authFile,
    authFileGroupPath, authFileGroupDefaultTag, authFileGroupKeySuffix,
    URL_AUTH_CHECK
  })

  const featurePermission = await configureFeaturePackPermission({
    logger, routePrefix,
    permissionType, permissionFunc, permissionFile
  })

  const featureExplorer = explorerRootPath && await configureFeaturePackExplorer({
    logger, routePrefix, featureAuth, featurePermission,
    explorerRootPath, explorerUploadMergePath, explorerStatusCommandList
  })

  const featureStatCollect = statCollectPath && await configureFeaturePackStatCollect({
    logger, routePrefix, featureAuth,
    statCollectPath, statCollectUrl, statCollectInterval
  })

  const featureStatReport = statReportProcessTag && await configureFeaturePackStatReport({
    logger, routePrefix, featureAuth,
    statReportProcessTag
  })

  const featureTaskRunner = taskRunnerRootPath && await configureFeaturePackTaskRunner({
    logger, routePrefix, featureAuth, featurePermission,
    taskRunnerRootPath
  })

  const redirectUrl = featureExplorer ? featureExplorer.URL_HTML
    : featureStatCollect ? featureStatCollect.URL_HTML
      : featureStatReport ? featureStatReport.URL_HTML
        : featureTaskRunner ? featureTaskRunner.URL_HTML
          : ''

  const responderLogEnd = createResponderLogEnd({ log: logger.add })

  const routeMap = createRouteMap([
    ...featureAuth.routeList,
    ...(featureExplorer ? featureExplorer.routeList : []),
    ...(featureStatCollect ? featureStatCollect.routeList : []),
    ...(featureStatReport ? featureStatReport.routeList : []),
    ...(featureTaskRunner ? featureTaskRunner.routeList : []),
    [ '/', 'GET', __DEV__ ? createResponderRouteListHTML({ getRouteMap: () => routeMap })
      : redirectUrl ? (store) => responderEndWithRedirect(store, { redirectUrl })
        : (store) => responderEndWithStatusCode(store, { statusCode: 400 })
    ],
    [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
  ].filter(Boolean))

  server.on('request', createRequestListener({
    responderList: [
      createResponderLog({ log: logger.add }),
      createResponderRouter({ routeMap, baseUrl: option.baseUrl })
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))

  return {
    featureAuth,
    featureExplorer,
    featureStatCollect,
    featureStatReport,
    featureTaskRunner
  }
}

export { configureSampleServer }