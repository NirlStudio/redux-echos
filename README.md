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
~~~~
import echos from 'redux-echos'

const store = createStore(reducer, applyMiddleware(echos))
~~~~
_note: this step may be safely skipped sometimes when redux-thunk is here._

### Action Forking
An action may proactively create more actions.
~~~~
import { echo } from 'redux-echos'

dispatch(echo(action))
~~~~

### Action Translating
A state may associate itself with another one which it depends on.
~~~~
import { register } from 'redux-echos'

register('The/Awesome/ACTION', (action, state) => ({
  type: 'I/Caught/YOU',
  some: state.an.important.value
}))
~~~~
or apply a selector to help the translator
~~~~
register('The/Awesome/ACTION', (action, state) => ({
  type: 'I/Caught/YOU',
  some: state
}), state => state.an.important.value)
~~~~

## Coding Practice
- w/ or w/o redux-thunk
- reducer-centred code organising.

## API Reference
### Basics
They should be enough for most scenarios.
- default: (store) => () => (next) => (action) => { ... } - the middleware
- echo(action) - generate an echo action for an target action.
- register(actionType, translator, selector) - register a translator function.

### Advanced
They should be used with a little bit carefulness.
- thunk(action)
- squeak(action)
- echos()
- thunkEnabled()
- enableThunk()
- disableThunk()
- translators(actionType)
- unregister(translator, actionType)

## Tour of Implementation
- Why not Observable?
- Where's the coolest new ES*?
- Design Principles
- Performance Concerns

## The Last Of Last, actually
In this document, the word _state_ is actually used with the meaning of sub-state since it is not referring the root state of the redux store.
