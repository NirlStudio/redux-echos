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

function middleware (store) {
  return function (next) {
    return function (action) {
      if (action.type === ActionType) {
        reflect(store.dispatch.bind(store), action.action)
      } else {
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
// expose current echos to allow developers to do anything with them
middleware.echos = function () {
  return echos
}
// the auto-selected action creator
middleware.echo = function (action) {
  return thunkEnabled ? thunk(action) : squeak(action)
}

// use the middleware as the default exports.
module.exports = middleware
