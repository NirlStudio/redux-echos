'use strict'

var assert = require('assert')
var echos = require('./index')

var hasThunk
try {
  hasThunk = require('redux-thunk')
} catch (e) {
  hasThunk = false
}

describe('module', function () {
  describe('exports', function () {
    it('should be a middleware (function)', function () {
      assert(typeof echos === 'function')
    })
    it('should have string ActionTypeSqueak', function () {
      assert(typeof echos.ActionTypeSqueak === 'string')
    })
    it('should have function thunk', function () {
      assert(typeof echos.thunk === 'function')
    })
    it('should have function squeak', function () {
      assert(typeof echos.squeak === 'function')
    })
    it('should have function thunkEnabled', function () {
      assert(typeof echos.thunkEnabled === 'function')
    })
    it('should have function enableThunk', function () {
      assert(typeof echos.enableThunk === 'function')
    })
    it('should have function disableThunk', function () {
      assert(typeof echos.disableThunk === 'function')
    })
    it('should have function echos', function () {
      assert(typeof echos.echos === 'function')
    })
    it('should have function echo', function () {
      assert(typeof echos.echos === 'function')
    })
  })
})

describe('Action Mode', function () {
  describe('Automatic', function () {
    hasThunk ? it('should enable thunk w/ redux-thunk.', function () {
      assert(echos.thunkEnabled() === true)
    }) : it('should disable thunk w/o redux-thunk.', function () {
      assert(echos.thunkEnabled() === false)
    })
  })
  describe('enableThunk', function () {
    it('should enable thunk when explicitly requested.', function () {
      echos.enableThunk()
      assert(echos.thunkEnabled() === true)
    })
  })
  describe('disableThunk', function () {
    it('should disable thunk when explicitly requested.', function () {
      echos.disableThunk()
      assert(echos.thunkEnabled() === false)
    })
  })
})

describe('Action Creators', function () {
  describe('thunk', function () {
    it('should return a thunk function.', function (done) {
      var a = {type: 'test'}
      var t = echos.thunk(a)
      assert(typeof t === 'function')

      var dispatched = null
      var p = t(function (action) { dispatched = action })
      assert(p instanceof Promise)

      p.then(function (action) {
        if (!dispatched) {
          done('original action has not been dispatched.', a)
        } else if (action !== a) {
          done('missing original action', a, action)
        } else {
          done()
        }
      })
      assert(Array.isArray(echos.echos()))
    })
  })
  describe('squeak', function () {
    it('should return an action object.', function () {
      var a = {type: 'test'}
      var s = echos.squeak(a)
      assert(typeof s === 'object')
      assert(s.type === echos.ActionTypeSqueak)
      assert(s.action === a)
    })
  })
  describe('echo', function () {
    it('should return an action object when thunk is disabled.', function () {
      var a = {type: 'test'}
      echos.disableThunk()
      var s = echos.echo(a)
      assert(typeof s === 'object')
      assert(s.type === echos.ActionTypeSqueak)
      assert(s.action === a)
    })
    it('should return a thunk function when thunk is enabled', function (done) {
      var a = {type: 'test'}
      echos.enableThunk()
      var t = echos.echo(a)
      assert(typeof t === 'function')

      var p = t(function (action) {
        assert(action === a, 'the original action should be dispatched.')
      })
      assert(p instanceof Promise)

      p.then(function (action) {
        assert(action === a, 'the original action should be resolved.')
        done()
      })
      assert(Array.isArray(echos.echos()))
    })
  })
})

describe('Middleware', function () {
  describe('receiving a squeak action', function () {
    it('should filter it out as an echo.', function (done) {
      var a = {type: 'test'}
      var store = {
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
  describe('receiving a unknown action', function () {
    it('should pass it to next processor.', function () {
      var a = {type: 'test'}
      var store = {
        dispatch: function (action) {
          assert(false, 'the dispatch function should not be called.')
        }
      }
      var next = function (action) {
        assert(action === a, 'the original action is missing.')
      }
      var action = echos.squeak(a)
      echos(store)(next)(action)
    })
  })
})
