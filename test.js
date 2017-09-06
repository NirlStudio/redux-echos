'use strict'
var redux = require('redux')
var assert = require('assert')
var echos = require('./index')

var thunk
try {
  thunk = require('redux-thunk').default
} catch (e) {
  thunk = null
}

describe('module', function () {
  describe('exports', function () {
    it('should be a middleware (function)', function () {
      assert.equal(typeof echos, 'function')
    })
    it('should have string ActionTypeSqueak', function () {
      assert.equal(typeof echos.ActionTypeSqueak, 'string')
    })
    it('should have function thunk', function () {
      assert.equal(typeof echos.thunk, 'function')
    })
    it('should have function squeak', function () {
      assert.equal(typeof echos.squeak, 'function')
    })
    it('should have function create', function () {
      assert.equal(typeof echos.create, 'function')
    })
    it('should have function thunkEnabled', function () {
      assert.equal(typeof echos.thunkEnabled, 'function')
    })
    it('should have function enableThunk', function () {
      assert.equal(typeof echos.enableThunk, 'function')
    })
    it('should have function disableThunk', function () {
      assert.equal(typeof echos.disableThunk, 'function')
    })
    it('should have function echos', function () {
      assert.equal(typeof echos.echos, 'function')
    })
    it('should have function echo', function () {
      assert.equal(typeof echos.echo, 'function')
    })
    it('should have function chain', function () {
      assert.equal(typeof echos.chain, 'function')
    })
    it('should have function translators', function () {
      assert.equal(typeof echos.translators, 'function')
    })
    it('should have function register', function () {
      assert.equal(typeof echos.register, 'function')
    })
    it('should have function unregister', function () {
      assert.equal(typeof echos.unregister, 'function')
    })
  })
})

describe('Action Mode', function () {
  describe('Automatic', function () {
    thunk ? it('should enable thunk w/ redux-thunk.', function () {
      assert.equal(echos.thunkEnabled(), true)
    }) : it('should disable thunk w/o redux-thunk.', function () {
      assert.equal(echos.thunkEnabled(), false)
    })
  })
  describe('enableThunk', function () {
    it('should enable thunk when explicitly requested.', function () {
      echos.enableThunk()
      assert.equal(echos.thunkEnabled(), true)
    })
  })
  describe('disableThunk', function () {
    it('should disable thunk when explicitly requested.', function () {
      echos.disableThunk()
      assert.equal(echos.thunkEnabled(), false)
    })
  })
})

describe('Action Creators', function () {
  describe('thunk', function () {
    it('should return a thunk function.', function (done) {
      var sa = {type: 'source'}
      var a = {type: 'test'}
      var t = echos.thunk(a, sa)
      assert.equal(typeof t, 'function', 'does not return a function.')

      var dispatched = null
      var p = t(function (action) {
        assert.equal(action.echoSource, sa, 'invalid source action')
        dispatched = action
      })
      assert(p instanceof Promise, 'thunk function does not return a promise.')

      p.then(function (action) {
        if (!dispatched) {
          done('original action has not been dispatched.')
        } else if (action !== a) {
          done('missing original action')
        } else {
          done()
        }
      })
      assert(Array.isArray(echos.echos()), 'echo has not been queued.')
    })
  })
  describe('squeak', function () {
    it('should return an action object.', function () {
      var sa = {type: 'source'}
      var a = {type: 'test'}
      var s = echos.squeak(a, sa)
      assert.equal(typeof s, 'object', 'does not return an action object.')
      assert.equal(s.type, echos.ActionTypeSqueak, 'invalid action type')
      assert.equal(s.action, a, 'invalid inner action.')
      assert.equal(s.action.echoSource, sa, 'invalid source action.')
    })
  })
  describe('create', function () {
    it('should return an action object when thunk is disabled.', function () {
      var a = {type: 'test'}
      echos.disableThunk()
      var s = echos.create(a)
      assert.equal(typeof s, 'object', 'does not return an action object.')
      assert.equal(s.type, echos.ActionTypeSqueak, 'invalid action type')
      assert.equal(s.action, a, 'invalid inner action.')
    })
    it('should return a thunk function when thunk is enabled', function (done) {
      var a = {type: 'test'}
      echos.enableThunk()
      var t = echos.create(a)
      assert.equal(typeof t, 'function', 'does not return a function.')

      var p = t(function (action) {
        assert(action === a, 'missing original action in dispatching.')
      })
      assert(p instanceof Promise)

      p.then(function (action) {
        assert(action === a, 'missing original action in resolving.')
        done()
      })
      assert(Array.isArray(echos.echos()), 'echo has not been queued.')
    })
  })
  describe('echo', function () {
    it('should dispatch an echo action into the current store.', function () {
      var counter = 0
      echos({
        getState: function () {},
        dispatch: function (action) {
          counter += 1
        }
      })(function () {})
      echos.echo({type: 'test'})
      assert.equal(counter, 1)
    })
  })
  describe('chain', function () {
    it('should connect an action after an action.', function () {
      redux.createStore(function (state, action) {
        return typeof state === 'undefined' ? null : state
      }, null, redux.applyMiddleware(thunk, echos))

      var a1 = {type: 'action1'}
      var a2 = {type: 'action2'}

      echos.chain(a1)(a2)
      assert.equal(a1.echoSource, null, 'source action 1 is invalid')
      assert.equal(a2.echoSource, a1, 'source action 2 is invalid')
    })
    it('should connect an thunk after an action.', function (done) {
      redux.createStore(function (state, action) {
        return typeof state === 'undefined' ? null : state
      }, redux.applyMiddleware(thunk, echos))

      var a1 = {type: 'action1'}
      var a2 = {type: 'action2'}
      var t0 = function (dispatch) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            dispatch(a2)
            resolve(a2)
            assert.equal(a1.echoSource, null, 'after: source action 1 is invalid')
            assert.equal(a2.echoSource, a1, 'after: source action 2 is invalid')
            assert.equal(a2.echoThunk, t0, 'after: source thunk 2 is invalid')
            done()
          })
        })
      }

      echos.chain(a1)(t0)
      assert.equal(a1.echoSource, null, 'before: source action 1 is invalid')
      assert.equal(a2.echoSource, null, 'before: source action 2 is invalid')
    })

    it('should connect an action after an thunk.', function (done) {
      redux.createStore(function (state, action) {
        return typeof state === 'undefined' ? null : state
      }, redux.applyMiddleware(thunk, echos))

      var a1 = {type: 'action1'}
      var a2 = {type: 'action2'}
      var t0 = function (dispatch) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            dispatch(a1)
            resolve(a1)
            assert.equal(a1.echoSource, null, 'after: source action 1 is invalid')
            assert.equal(a1.echoThunk, t0, 'after: source thunk 1 is invalid')
            assert.equal(a2.echoSource, a1, 'after: source action 2 is invalid')
            assert.equal(a2.echoThunk, null, 'after: source thunk 2 is invalid')
            done()
          })
        })
      }

      echos.chain(t0)(a2)
      assert.equal(a1.echoSource, null, 'before: source action 1 is invalid')
      assert.equal(a2.echoSource, null, 'before: source action 2 is invalid')
    })
    it('should connect an thunk after an thunk.', function (done) {
      redux.createStore(function (state, action) {
        return typeof state === 'undefined' ? null : state
      }, redux.applyMiddleware(thunk, echos))

      var a1 = {type: 'action1'}
      var a2 = {type: 'action2'}
      var t1 = function (dispatch) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            dispatch(a1)
            resolve(a1)
            assert.equal(a1.echoSource, null, 'after: source action 1 is invalid')
            assert.equal(a1.echoThunk, t1, 'after: source thunk 1 is invalid')
          })
        })
      }
      var t2 = function (dispatch) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            dispatch(a2)
            resolve(a2)
            assert.equal(a2.echoSource, a1, 'after: source action 2 is invalid')
            assert.equal(a2.echoThunk, t2, 'after: source thunk 2 is invalid')
            done()
          })
        })
      }

      echos.chain(t1)(t2)
      assert.equal(a1.echoSource, null, 'before: source action 1 is invalid')
      assert.equal(a2.echoSource, null, 'before: source action 2 is invalid')
    })
    it('should work for a composite action chain.', function (done) {
      redux.createStore(function (state, action) {
        return typeof state === 'undefined' ? null : state
      }, redux.applyMiddleware(thunk, echos))

      var a1 = {type: 'action1'}
      var a2 = {type: 'action2'}
      var a3 = {type: 'action3'}
      var a4 = {type: 'action4'}
      var t1 = function (dispatch) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            dispatch(a1)
            resolve(a1)
            assert.equal(a1.echoSource, null, 'after: source action 1 is invalid')
            assert.equal(a1.echoThunk, t1, 'after: source thunk 1 is invalid')
          })
        })
      }
      var t2 = function (dispatch) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            dispatch(a2)
            resolve(a2)
            assert.equal(a2.echoSource, a3, 'after: source action 2 is invalid')
            assert.equal(a2.echoThunk, t2, 'after: source thunk 2 is invalid')
            assert.equal(a3.echoSource, a1, 'after: source action 3 is invalid')
            assert.equal(a4.echoSource, a2, 'after: source action 4 is invalid')
            done()
          })
        })
      }

      echos.chain(t1)(a3)(t2)(a4)
      assert.equal(a1.echoSource, null, 'before: source action 1 is invalid')
      assert.equal(a2.echoSource, null, 'before: source action 2 is invalid')
    })
  })
})

describe('Translators', function () {
  var t0 = function () {}
  var t1 = function () {}
  var t2 = function () {}
  describe('register', function () {
    it('should accept a function as translator', function () {
      echos.register('test', t0)
      var m = echos.translators()
      var l = echos.translators('test')
      assert.equal(m['test'], l, 'wrong translator list.')
      assert(Array.isArray(l), 'invalid translator list.')
      assert.equal(l.length, 1, 'wrong translator number.')
      assert.equal(l[0], t0, 'invalid translator.')
    })
    it('should accept an array of function as translators', function () {
      echos.register('test', [t1, t2])

      var m = echos.translators()
      var l = echos.translators('test')
      assert.equal(m['test'], l, 'wrong translator list.')
      assert(Array.isArray(l), 'invalid translator list.')
      assert.equal(l.length, 3, 'wrong translator number.')
      assert.equal(l[0], t0, 'invalid translator (0).')
      assert.equal(l[1], t1, 'invalid translator (1).')
      assert.equal(l[2], t2, 'invalid translator (2).')
    })
  })
  describe('unregister', function () {
    it('should accept a translator function to unregister', function () {
      echos.unregister(t1)

      var m = echos.translators()
      var l = echos.translators('test')
      assert.equal(m['test'], l, 'wrong translator list.')
      assert(Array.isArray(l), 'invalid translator list.')
      assert.equal(l.length, 2, 'wrong translator number.')
      assert.equal(l[0], t0, 'invalid translator (0).')
      assert.equal(l[1], t2, 'invalid translator (1).')
    })
    it('should accept an array of translator functions to unregister', function () {
      echos.unregister([t0, t2])

      var m = echos.translators()
      var l = echos.translators('test')
      assert.equal(m['test'], l, 'wrong translator list.')
      assert(Array.isArray(l), 'invalid translator list.')
      assert.equal(l.length, 0, 'wrong translator number.')
    })
    it('should unregister translator for a specific action type', function () {
      echos.register('test1', [t0, t1])
      echos.register('test2', [t0, t2])
      var l1 = echos.translators('test1')
      var l2 = echos.translators('test2')
      assert.equal(l1.length, 2, 'invalid translators for test1')
      assert.equal(l2.length, 2, 'invalid translators for test2')

      echos.unregister(t0, 'test2')
      assert.equal(l1.length, 2, 'stage1: invalid translator number for test1')
      assert.equal(l1[0], t0, 'stage1: invalid test1 (0)')
      assert.equal(l1[1], t1, 'stage1: invalid test1 (1)')
      assert.equal(l2.length, 1, 'stage1: invalid translator number for test2')
      assert.equal(l2[0], t2, 'stage1: invalid test2 (0)')

      echos.unregister([t1, t2], 'test1')
      assert.equal(l1.length, 1, 'stage2: invalid translator number for test1')
      assert.equal(l1[0], t0, 'stage2: invalid test1 (0)')
      assert.equal(l2.length, 1, 'stage2: invalid translator number for test2')
      assert.equal(l2[0], t2, 'stage2: invalid test2 (0)')
    })
  })
})

describe('Middleware', function () {
  describe('receiving a squeak action', function () {
    it('should filter it out as an echo.', function (done) {
      var a = {type: 'test'}
      var store = {
        getState: function () { return {} },
        dispatch: function (action) {
          assert(this === store, 'thisArg should be bound to store.')
          assert(action === a, 'the original action should be dispatched')
          assert(echos.echos() === null, 'the dispatched echos should be cleared')
          done()
        }
      }
      var next = function () {
        assert(false, 'the squeak action should be suppressed.')
      }
      var action = echos.squeak(a)
      echos(store)(next)(action)
    })
  })
  describe('receiving a common action', function () {
    it('may translate it to no echo.', function () {
      echos.register('SRC_ACTION1', function (action, state) {
        assert.equal(typeof action, 'object', 'invalid action.')
        assert.equal(typeof state, 'object', 'invalid state object.')
      })
      echos({
        getState: function () { return {} },
        dispatch: function () {}
      })(function () {})({
        type: 'SRC_ACTION1'
      })
      assert.equal(echos.echos(), null)
    })
    it('may translate it to an echo action.', function (done) {
      var a = {type: 'echo', value: 'a1'}
      echos.register('SRC_ACTION2', function (action, state) {
        assert.equal(typeof action, 'object', 'invalid action.')
        assert.equal(state, 'value', 'invalid state value.')
        return a
      }, function (state) {
        return state.real
      })
      echos({
        getState: function () { return {real: 'value'} },
        dispatch: function (action) {
          assert.equal(action, a, 'wrong echo action')
          done()
        }
      })(function () {})({
        type: 'SRC_ACTION2'
      })
      assert(Array.isArray(echos.echos()), 'missing echos.')
      assert.equal(echos.echos().length, 1, 'wrong echo number.')
      assert.equal(echos.echos()[0].action, a, 'wrong echo action.')
      assert.equal(typeof echos.echos()[0].dispatch, 'function',
        'wrong echo dispatcher.')
    })
    it('may translate it to echo actions.', function (done) {
      var a = {type: 'echo', value: 'a2'}
      var b = {type: 'echo', value: 'b2'}
      echos.register('SRC_ACTION3', function (action, state) {
        assert.equal(typeof action, 'object', 'invalid action.')
        assert.equal(typeof state, 'object', 'invalid state object.')
        return [a, b]
      })
      var counter = 0
      echos({
        getState: function () { return {} },
        dispatch: function (action) {
          assert(action === a || action === b, 'wrong echo action')
          counter += 1
          if (counter === 2) {
            done()
          }
        }
      })(function () {})({
        type: 'SRC_ACTION3'
      })
      assert(Array.isArray(echos.echos()), 'missing echos.')
      assert.equal(echos.echos().length, 2, 'wrong echo number.')
      assert.equal(echos.echos()[0].action, a, 'wrong echo a.')
      assert.equal(typeof echos.echos()[0].dispatch, 'function',
        'wrong echo a dispatcher.')
      assert.equal(echos.echos()[1].action, b, 'wrong echo b.')
      assert.equal(typeof echos.echos()[1].dispatch, 'function',
        'wrong echo b dispatcher.')
    })
    it('should pass it to next processor.', function () {
      var a = {type: 'test'}
      var store = {
        getState: function () { return {} },
        dispatch: function (action) {
          assert(false, 'the dispatch function should not be called.')
        }
      }
      var next = function (action) {
        assert.equal(action, a, 'the original action is missing.')
      }
      echos(store)(next)(a)
    })
  })
})
