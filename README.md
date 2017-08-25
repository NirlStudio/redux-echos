# redux-echos
A lightweight redux middleware to decouple and serialise state dependencies.

_This sounds awful. Or a better version:_

It helps to deal with the to-be-laterly-dispatched actions.

### Scenarios
- state dependency
- action workflow

## Examples
### First of First, but not actually
Apply echos as a middleware to the redux store.
~~~~javascript
import echos from 'redux-echos'
import { createStore, applyMiddleware } from 'redux'

const store = createStore(reducer, applyMiddleware(echos))
~~~~
_note-1: this step may be safely skipped sometimes when redux-thunk is here and you would dispatch all echo actions manually._

_note-2: If note-1 does not make clear sense for you, applying the middleware is a safer option._

### Action Forking
An action, in its reducer, may spawn other action(s) now.
~~~~javascript
import { echo } from 'redux-echos'

const reducer = (state, action) => {
  if (action.type === 'The/Awesome/ACTION') {
    echo({
      type: 'Do/This/Later',
      some: state.an.important.value
    })
    return {...state, key: value}
  }
  return state
}
~~~~
_And of course, the function echo() can also be called out of a reducer to queue an action._

### Action Translating
A state may associate itself with another one which it depends on.
~~~~javascript
import { register } from 'redux-echos'

const translator = (action, state) => ({
  type: 'I/Caught/YOU',
  some: state.an.important.value
})

register('The/Awesome/ACTION', translator)
~~~~
or apply a selector to help the translator
~~~~javascript
const translator = (action, value) => ({
  type: 'I/Caught/YOU',
  some: value
})

const selector = state => state.an.important.value

register('The/Awesome/ACTION', translator, selector)
~~~~

## Coding Practice
- w/ or w/o redux-thunk
- reducer-centred code organising.

## API Reference
### Basics
They should be enough for common scenarios.

#### default exports: middleware(store) => (next) => (action)
the middleware

#### echo(action)
generate an echo action for an target action.

#### register(actionType, translator[, selector])
register a translator function.

### Advanced
They should be used with a little bit carefulness.

#### thunk(action) => (dispatch)
explicitly create a thunk as the echo action.

#### squeak(action)
explicitly create an common object echo action.

#### create(action)
automatically create a thunk or an object by the existence of redux-thunk.

#### echos()
peek all current queued echo actions.

#### thunkEnabled()
query if the thunk mode is enabled.

#### enableThunk()
explicitly to enable thunk mode.

#### disableThunk()
explicitly to disable thunk mode.

#### translators([actionType])
peek all registered translators (as an object of action-type -> array-of-translator map) or an array of translators for the actionType.

#### unregister(translator[, actionType])
remove a translator from all actions or a particular action.

## Tour of Implementation
- Why not Observable?
- Design Principles
- Performance Concerns

## The Last Of Last, actually
In this document, the word _state_ is actually used with the meaning of sub-state since it is not referring the root state of the redux store.
