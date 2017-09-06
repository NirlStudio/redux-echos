'use strict'

// the action type value.
var ActionType = 'Redux/Echos/SQUEAK'

// helper trace functions.
var info = console.info || function () {}
var warn = console.warn || function () {}

// determine if to enable thunk mode.
var thunkEnabled
var hasThunk
try {
  hasThunk = require('redux-thunk')
  thunkEnabled = typeof Promise === 'function'
} catch (e) {
  thunkEnabled = false
}
info('redux-echos: thunk mode is', thunkEnabled ? 'enabled.' : 'disabled.')

// the echo store
var echos = null
var translatorMap = Object.create(null)

// the echo dispatcher
function dispatchEchos () {
  var queue = echos; echos = null
  for (var i = 0; i < queue.length; i++) {
    queue[i].dispatch()
    info('redux-echos: action is dispatched:', queue[i].action)
  }
}

function link (thunk, source) {
  if (typeof thunk === 'function') { // a action thunk
    var linkedThunk = function (dispatch) {
      return thunk(function (action) {
        // try to skip wrapper thunk.
        action.echoThunk = thunk.echoThunk || thunk
        if (typeof action.echoSource === 'undefined') {
          action.echoSource = source || null
        }
        dispatch(action)
      })
    }
    // wrapper thunk should expose the real thunk
    linkedThunk.echoThunk = thunk
    return linkedThunk
  } else { // a common action object
    if (typeof thunk.echoSource === 'undefined') {
      thunk.echoSource = source || null
    }
    return thunk
  }
}

// the inner squeak reflector.
function reflect (dispatch, action, source, resolve) {
  var echoAction = link(action, source)
  var echo = {
    action: action, // for possible later manipulation.
    dispatch: resolve ? function () {
      dispatch(echoAction)
      resolve(action) // always resolved to original action.
    } : function () {
      dispatch(echoAction)
    }
  }
  if (echos) {
    echos.push(echo)
  } else {
    echos = [echo]
    setTimeout(dispatchEchos)
  }
  info('redux-echos: action is queued:', echoAction)
}
// reflect a series of actions.
function reflectAll (dispatch, actions, source) {
  for (var i = 0; i < actions.length; i++) {
    reflect(dispatch, actions[i], source)
  }
}

// the action for redux-thunk
function thunk (action, source) {
  return function (dispatch) {
    return new Promise(function (resolve) {
      reflect(dispatch, action, source, resolve)
    })
  }
}

// the action w/o redux-thunk
function squeak (action, source) {
  action.echoSource = source || null
  return {
    type: ActionType,
    action: action
  }
}

// the auto-selected echo action creator
function create (action, source) {
  return thunkEnabled ? thunk(action, source) : squeak(action, source)
}

function translatingWith (getState, reflecting, reflectingAll) {
  return function (action) {
    var state = getState()
    var translators = translatorMap[action.type]
    if (translators) {
      for (var i = 0; i < translators.length; i++) {
        var echo = translators[i](action, translators[i].stateSelector
            ? translators[i].stateSelector(state) : state)
        if (Array.isArray(echo)) {
          reflectingAll(echo, action)
        } else if (echo) {
          reflecting(echo, action)
        }
      }
    }
  }
}

// the default dispatcher bound to a store. So it's not safe if there're more
// than one store existing.
var dispatching

function middleware (store) {
  // create context-bound functions
  dispatching = store.dispatch.bind(store)
  var getState = store.getState.bind(store)
  var reflecting = reflect.bind(null, dispatching)
  var reflectingAll = reflectAll.bind(null, dispatching)
  var translating = translatingWith(getState, reflecting, reflectingAll)
  // return the handler generator
  return function (next) {
    return function (action) {
      if (action.type === ActionType) {
        // queue & suppress.
        reflecting(action.action, action.source)
      } else {
        // translate & forward
        translating(action)
        next(action)
      }
    }
  }
}

/* Assembly the middleware */
// export action type value
middleware.ActionTypeSqueak = ActionType

// export raw action creators
middleware.thunk = thunk
middleware.squeak = squeak
middleware.create = create

// explicitiy choose the work mode.
middleware.thunkEnabled = function () {
  return thunkEnabled
}
middleware.enableThunk = function () {
  if (!hasThunk) {
    warn('redux-echos: module redux-thunk is missing.')
  }
  if (typeof Promise !== 'function') {
    warn('redux-echos: type Promise is missing.')
  }
  return (thunkEnabled = true)
}
middleware.disableThunk = function () {
  return (thunkEnabled = false)
}
// expose current echos to be manipulated.
middleware.echos = function () {
  return echos
}
// create & dispatch an echo action to the default store.
middleware.echo = function (action, source) {
  dispatching(create(action, source))
  return action
}

function chainTerminator (action) {
  warn('redux-echos: chain reaction has completed, so action is abandoned:', action)
  return chainTerminator
}

function chainReactor (thunk) {
  var actionChain = []
  // extend a thunk to connect subsequential actions
  var extend = function (thunk) {
    var extendedThunk = function (dispatch) {
      return thunk(function (action) {
        if (!actionChain || !actionChain.length) {
          return dispatch(action)
        }
        if (typeof action === 'function') {
          // continue to wait a real action.
          return dispatch(extend(action))
        }
        // ending of current action chain.
        var actions = actionChain
        actionChain = null // prevent any new actions.
        var result = dispatch(action)
        // fix up the source action for the first action in chain.
        actions[0] = link(actions[0], action)
        for (var i = 0; i < actions.length; i++) {
          dispatching(actions[i])
        }
        return result
      })
    }
    extendedThunk.echoThunk = thunk
    return extendedThunk
  }
  // connect a subsequential action into current chain.
  var connect = function (action) {
    if (!actionChain) {
      // invalid operation: actions have been completed.
      return chainTerminator(action)
    }
    if (!action) {
      // terminate current chain and return the last action.
      return actionChain.length > 0 ? actionChain[actionChain.length - 1] : thunk
    }
    if (actionChain.length > 0) {
      // link the source action to current action
      action = link(action, actionChain[actionChain.length - 1])
    }
    if (typeof action === 'function') { // to create a new chain for a thunk
      var chain = chainReactor(action)
      actionChain.push(chain.thunk)
      return chain.connect // switch to the connector of new chain
    } else { // use current reactor for a common action object.
      actionChain.push(action)
      return connect // keep using current connector
    }
  }
  // compose the chain reactor
  return {
    thunk: extend(thunk),
    connect: connect
  }
}

// create & dispatch an echo action to the default store.
middleware.chain = function (action, source) {
  if (typeof action === 'function') { // action is a thunk
    var chain = chainReactor(action)
    dispatching(create(chain.thunk, source))
    return chain.connect
  } else { // TODO: support redux-promise
    dispatching(create(action, source))
    return function (nextAction) {
      if (nextAction) {
        return middleware.chain(nextAction, action)
      } else {
        return action // terminate current chain and return the last action.
      }
    }
  }
}

// a more readable version of chain when souce exists.
middleware.follow = function (source) {
  return function (action) {
    return middleware.chain(action, source)
  }
}

// expose translators to be manipulated, even it's not suggested generally.
middleware.translators = function (actionType) {
  return actionType ? (translatorMap[actionType] || []) : translatorMap
}
// register a translator for a particular action.
middleware.listen = function (actionType, translator, selector) {
  var list = translatorMap[actionType]
  if (!list) {
    translatorMap[actionType] = list = []
  }
  var translators = Array.isArray(translator) ? translator : [translator]
  for (var i = 0; i < translators.length; i++) {
    if (selector) {
      translators[i].stateSelector = selector
    }
    list.push(translators[i])
  }
}
// unregister a translator for an action or for all actions.
middleware.unlisten = function (translator, actionType) {
  var translators = Array.isArray(translator) ? translator : [translator]
  var actionTypes = actionType ? [actionType]
    : Object.getOwnPropertyNames(translatorMap)
  for (var i = 0; i < actionTypes.length; i++) {
    var list = translatorMap[actionTypes[i]]
    if (list) {
      var j = 0
      while (j < list.length) {
        var k = 0
        for (; k < translators.length; k++) {
          if (list[j] === translators[k]) {
            list.splice(j, 1)
            break
          }
        }
        if (k >= translators.length) {
          j += 1
        }
      }
    }
  }
}

// use the middleware as the default exports.
module.exports = middleware
