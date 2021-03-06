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
~~~~js
import echos from 'redux-echos'
import { createStore, applyMiddleware } from 'redux'

const store = createStore(reducer, applyMiddleware(echos))
~~~~
_note-1: this step may be safely skipped sometimes when redux-thunk is here and you would dispatch all echo actions manually._

_note-2: If note-1 does not make clear sense for you, applying the middleware is a safer option._

### Action Forking
An action, in its reducer, may spawn other action(s) now.
~~~~js
import { echo } from 'redux-echos'

const reducer = (state, action) => {
  if (action.type === 'The/Source/ACTION') {
    echo({
      type: 'An/Echo/ACTION',
      some: state.an.important.value
    }, action)
    return {...state, key: 'new-value'}
  }
  return state
}
~~~~
_And of course, the function echo() can also be called out of a reducer to queue an action._

### Action Chain
Instead of emitting one or several independent actions, you can make a series of actions, which can have thunks, to be dispatched sequentially.
~~~~js
import { chain } from 'redux-echos'

const reducer = (state, action) => {
  if (action.type === 'User/Is/AUTHENTICATED') {
    chain(
      NetworkActions.loadUserProfile(), action
    )(
      NetworkActions.loadFriendProfiles()
    )
    return {...state, key: 'new-value'}
  }
  return state
}
~~~~
And if all actions in a chain are common object actions, like:
~~~~js
chain(A1)(A2)(A3)...
~~~~
works exactly like:
~~~~js
echo(A1); echo(A2, A1); echo(A3, A2); ...
~~~~
But if there is a thunk, e.g: A1, then A2 will only be dispatched after A1's resolved action has been dispatched.

If the resolved action is still a thunk, A2 will continue to wait recursively until a final action is dispatched.

_note-1: currently, redux-echos only supports redux-thunk._

_note-2: if the source action is not empty, for example:_
~~~~js
chain(A1, A0)(A2)(A3)...
~~~~
_can be coded as:_
~~~~js
import { follow } from 'redux-echos'
follow(A0)(A1)(A2)(A3) ...
~~~~
_since the A0 is taken as the source action, follow(...) will not try to dispatch it._

_note-3: if you need more complex workflow like feature of forking & merging, please refer to [redux-action-flow](https://github.com/NirlStudio/redux-action-flow)_

### Action Translating
A state may associate itself with another one which it depends on.
~~~~js
import { listen } from 'redux-echos'

const translator = (action, state) => ({
  type: 'An/Echo/ACTION',
  some: state.an.important.value
})

listen('The/Source/ACTION', translator)
~~~~
or apply a selector to help the translator
~~~~js
const translator = (action, value) => ({
  type: 'An/Echo/ACTION',
  some: value
})

const selector = state => state.an.important.value

listen('The/Source/ACTION', translator, selector)
~~~~

## Coding Practice
- w/ or w/o redux-thunk
- reducer-centred code organising.
- analyse action flow.

## API Reference
### Basics
They should be enough for common scenarios.

#### default exports: middleware(store) => (next) => (action)
the middleware

#### echo(action, source)
generate an echo action for an target action.

#### chain(action[, source])
create an action chain from an action with an optional source action.

#### follow(source)
create an action chain from an source action.

#### listen(actionType, translator[, selector])
listen to a type of action to apply a translator to generate none, one or more forked actions.

### Advanced
They should be used with a little bit carefulness.

#### thunk(action[, source]) => (dispatch)
explicitly create a thunk as the echo action for an optional source action.

#### squeak(action[, source])
explicitly create an common object echo action for an optional source action.

#### create(action[, source])
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
peek all listening translators (as an object of action-type -> array-of-translator map) or an array of translators for the actionType.

#### unlisten(translator[, actionType])
remove a translator from all actions or a particular action.

## Tour of Implementation
- Why not Observable?
- Design Principles
- Performance Concerns

## The Last Of Last, actually
In this document, the word _state_ is actually used with the meaning of sub-state since it is not referring the root state of the redux store.
