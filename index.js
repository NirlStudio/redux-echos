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

// the inner squeak reflector.
function reflect (dispatch, action, resolve) {
  var echo = {
    action: action, // for possible later manipulation.
    dispatch: resolve ? function () {
      dispatch(action)
      resolve(action)
    } : function () {
      dispatch(action)
    }
  }
  if (echos) {
    echos.push(echo)
  } else {
    echos = [echo]
    setTimeout(dispatchEchos)
  }
  info('redux-echos: action is queued:', action)
}
// reflect a series of actions.
function reflectAll (dispatch, actions) {
  for (var i = 0; i < actions.length; i++) {
    reflect(dispatch, actions[i])
  }
}

// the action for redux-thunk
function thunk (action) {
  return function (dispatch) {
    return new Promise(function (resolve) {
      reflect(dispatch, action, resolve)
    })
  }
}

// the action w/o redux-thunk
function squeak (action) {
  return {
    type: ActionType,
    action: action
  }
}

// the auto-selected echo action creator
function create (action) {
  return thunkEnabled ? thunk(action) : squeak(action)
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
          reflectingAll(echo)
        } else if (echo) {
          reflecting(echo)
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
        reflecting(action.action)
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
middleware.echo = function (action) {
  return dispatching(create(action))
}
// expose translators to be manipulated, even it's not suggested generally.
middleware.translators = function (actionType) {
  return actionType ? (translatorMap[actionType] || []) : translatorMap
}
// register a translator for a particular action.
middleware.register = function (actionType, translator, selector) {
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
middleware.unregister = function (translator, actionType) {
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
