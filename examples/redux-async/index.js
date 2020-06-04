import fetch from 'node-fetch';
import { createStore, applyMiddleware, combineReducers } from 'redux';

// import asyncFetch from 'redux-async-fetch';
import asyncFetch, { CALL_API } from '../../src/middleware';

import logger from '../mw-logger/redux-logger';

global.fetch = fetch;

const LOAD_INCREMENT_REQUEST = 'LOAD_INCREMENT_REQUEST';
const LOAD_INCREMENT_SUCCESS = 'LOAD_INCREMENT_SUCCESS';
const LOAD_INCREMENT_FAILURE = 'LOAD_INCREMENT_FAILURE';

const LOAD_DECREMENT_REQUEST = 'LOAD_DECREMENT_REQUEST';
const LOAD_DECREMENT_SUCCESS = 'LOAD_DECREMENT_SUCCESS';
const LOAD_DECREMENT_FAILURE = 'LOAD_DECREMENT_FAILURE';

// reducers
function runningReducer(
  state = {
    decrement: 0,
    increment: 0,
  },
  action,
) {
  const { type } = action;
  switch (type) {
    case LOAD_INCREMENT_REQUEST: {
      return {
        ...state,
        increment: state.increment + 1,
      };
    }
    case LOAD_INCREMENT_SUCCESS: {
      return {
        ...state,
        increment: state.increment - 1,
      };
    }
    case LOAD_INCREMENT_FAILURE: {
      return {
        ...state,
        increment: state.increment - 1,
      };
    }
    case LOAD_DECREMENT_REQUEST: {
      return {
        ...state,
        decrement: state.decrement + 1,
      };
    }
    case LOAD_DECREMENT_SUCCESS: {
      return {
        ...state,
        decrement: state.decrement - 1,
      };
    }
    case LOAD_DECREMENT_FAILURE: {
      return {
        ...state,
        decrement: state.decrement - 1,
      };
    }
    default:
      break;
  }
  return state;
}

function counterReducer(state = 0, action) {
  const { type, payload } = action;
  switch (type) {
    case LOAD_INCREMENT_SUCCESS:
    case LOAD_DECREMENT_SUCCESS: {
      const { value } = payload;
      return state + value;
    }
    default:
      break;
  }
  return state;
}

const mappings = {
  INCREMENT: 'http://localhost:4000/increment',
  DECREMENT: 'http://localhost:4000/decrement',
};

const store = createStore(
  combineReducers({
    running: runningReducer,
    counter: counterReducer,
  }),
  0,
  applyMiddleware(asyncFetch(mappings), logger),
);

store.dispatch({ [CALL_API]: { type: LOAD_INCREMENT_REQUEST } });
store.dispatch({ [CALL_API]: { type: LOAD_DECREMENT_REQUEST } });

store.dispatch({ [CALL_API]: { type: LOAD_INCREMENT_REQUEST } });
store.dispatch({ [CALL_API]: { type: LOAD_DECREMENT_REQUEST } });

store.dispatch({ [CALL_API]: { type: LOAD_INCREMENT_REQUEST } });
store.dispatch({ [CALL_API]: { type: LOAD_DECREMENT_REQUEST } });
