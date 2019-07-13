import { createResponderCheckRateLimit } from 'dr-js/module/node/server/Responder/RateLimit'

import { getParamFromRequest } from 'source/function'

const createResponderCheckAuth = ({
  authPack: { authKey, checkAuth },
  responderNext,
  responderDeny // optional
}) => createResponderCheckRateLimit({
  checkFunc: async (store) => {
    const authToken = await checkAuth(getParamFromRequest(store, authKey))
    store.setState({ authToken })
    return true // pass check
  },
  responderNext,
  responderDeny
})

const createResponderGrantAuthHeader = ({
  authPack: { authKey, generateAuthHeader },
  responder
}) => async (store, requestTag) => {
  store.response.setHeader(authKey, await generateAuthHeader(requestTag))
  return responder(store)
}

export {
  createResponderCheckAuth,
  createResponderGrantAuthHeader
}