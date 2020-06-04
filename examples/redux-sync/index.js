import fetch from 'node-fetch';
import { createStore, applyMiddleware } from 'redux';

// import asyncFetch from 'redux-async-fetch';
import asyncFetch, { CALL_API } from '../../src';

import logger from '../mw-logger/redux-logger';

global.fetch = fetch;

const LOAD_TODOS_REQUEST = 'LOAD_TODOS_REQUEST';
const LOAD_TODOS_SUCCESS = 'LOAD_TODOS_SUCCESS';
//
const CREATE_TODOS_REQUEST = 'CREATE_TODOS_REQUEST';
const CREATE_TODOS_SUCCESS = 'CREATE_TODOS_SUCCESS';
//
const DELETE_TODOS_REQUEST = 'DELETE_TODOS_REQUEST';
const DELETE_TODOS_SUCCESS = 'DELETE_TODOS_SUCCESS';
//
const MODIFY_TODOS_REQUEST = 'MODIFY_TODOS_REQUEST';
const MODIFY_TODOS_SUCCESS = 'MODIFY_TODOS_SUCCESS';
//
const UPDATE_TODOS_REQUEST = 'UPDATE_TODOS_REQUEST';
const UPDATE_TODOS_SUCCESS = 'UPDATE_TODOS_SUCCESS';
//

function reducer(state = [], action) {
  const { type } = action;
  switch (type) {
    case LOAD_TODOS_SUCCESS: {
      const { id, payload } = action;
      if (id) {
        // replace or append the fetched element
        const findIndex = state.findIndex((t) => {
          return `${t.id}` === `${id}`;
        });
        if (findIndex !== -1) {
          return [
            ...state.slice(0, findIndex),
            payload,
            ...state.slice(findIndex + 1),
          ];
        }
        return [...state, payload];
      }
      // refresh the entire list
      return payload;
    }

    case CREATE_TODOS_SUCCESS: {
      const { payload } = action;
      return [...state, payload];
    }

    case MODIFY_TODOS_SUCCESS:
    case UPDATE_TODOS_SUCCESS: {
      const { id, payload } = action;
      const findIndex = state.findIndex((t) => {
        return `${t.id}` === `${id}`;
      });
      return [
        ...state.slice(0, findIndex),
        payload,
        ...state.slice(findIndex + 1),
      ];
    }

    case DELETE_TODOS_SUCCESS: {
      const { id } = action;
      const findIndex = state.findIndex((t) => {
        return `${t.id}` === `${id}`;
      });
      return [...state.slice(0, findIndex), ...state.slice(findIndex + 1)];
    }

    default:
      break;
  }
  return state;
}

const endpoints = {
  TODOS: 'http://localhost:4000/todos',
};

const store = createStore(
  reducer,
  [{ id: 1, task: 'Pay bills' }],
  applyMiddleware(asyncFetch(endpoints, { logLevel: 'debug' }), logger),
);

(async () => {
  // LOAD one
  await store.dispatch({
    [CALL_API]: {
      type: LOAD_TODOS_REQUEST,
      id: 2,
    },
    params: '/2',
  });
  // LOAD all
  await store.dispatch({
    [CALL_API]: {
      type: 'LOAD_TODOS_REQUEST',
    },
  });
  // CREATE
  const { payload } = await store.dispatch({
    [CALL_API]: {
      type: CREATE_TODOS_REQUEST,
      task: 'Walk dog',
    },
    body: { task: 'Walk dog' },
  });
  const { id } = payload;
  // UPDATE
  await store.dispatch({
    [CALL_API]: { type: UPDATE_TODOS_REQUEST, id },
    body: { task: 'Walk 🐕' },
    params: `/${id}`,
  });
  // MODIFY
  await store.dispatch({
    [CALL_API]: { type: MODIFY_TODOS_REQUEST, id },
    body: { task: 'Walk 🐶' },
    params: `/${id}`,
  });
  // DELETE
  await store.dispatch({
    [CALL_API]: { type: DELETE_TODOS_REQUEST, id },
    params: `/${id}`,
  });
})();
