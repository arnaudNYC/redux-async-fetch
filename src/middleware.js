import Logger from './logger';

const DEFAULT_STEPS = ['REQUEST', 'SUCCESS', 'FAILURE'];

const DEFAULT_OPTIONS = {
  logLevel: 'off',
  methods: {
    CREATE: 'POST',
    DELETE: 'DELETE',
    LOAD: 'GET',
    UPDATE: 'PATCH',
    MODIFY: 'PUT',
  },
};

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const CALL_API = 'Call API';

function resolveUrl(targetUrl, params) {
  if (typeof params === 'object') {
    const searchParams = Object.keys(params).reduce(
      (acc, p) => [...acc, `${p}=${params[p]}`],
      [],
    );

    const separator = targetUrl.includes('?') ? '&' : '?';
    return `${targetUrl}${separator}${searchParams.join('?')}`;
  }
  //
  if (typeof params === 'string') {
    return `${targetUrl}${params}`;
  }

  return targetUrl;
}

function middleware(endpoints = {}, options = {}) {
  // options
  const { logLevel, methods } = {
    ...DEFAULT_OPTIONS,
    ...options,
    methods: {
      ...DEFAULT_OPTIONS.methods,
      ...options.methods,
    },
  };

  const log = Logger(logLevel);

  function validateAction(action) {
    if (typeof action.type === 'undefined') {
      return [
        'Action type is missing, expected format is',
        "{ [CALL_API]: { type: 'VERB_ENDPOINT_STEP' } }",
      ];
    }
    const splitAction = action.type.split('_');
    const [verb, endpoint, step] = splitAction;

    // check action
    if (splitAction.filter(Boolean).length !== 3) {
      return [
        'Action type invalid, it should match VERB_ENDPOINT_STEP (e.g. LOAD_ACTION_REQUEST)',
      ];
    }
    // check verb
    if (!methods[verb]) {
      return [
        `Unsupported action verb ${verb}, expected one of ${Object.keys(
          methods,
        )}`,
      ];
    }
    // check endpoint
    if (!endpoints[endpoint]) {
      return [
        `Unknown endpoint ${endpoint}, expected one of ${Object.keys(
          endpoints,
        )}`,
      ];
    }

    if (!DEFAULT_STEPS.includes(step)) {
      return [
        `Unknown step ${step}, expected one of ${Object.keys(DEFAULT_STEPS)}`,
      ];
    }
    return [];
  }

  // no endpoints provided, skip
  if (Object.keys(endpoints).length === 0) {
    log.warn('No endpoints found, no subsequent action will be taken');
    return () => (next) => (action) => next(action);
  }

  return () => (next) => async (callAction) => {
    const { [CALL_API]: action, body, headers = {}, params = '' } = callAction;

    if (typeof action === 'undefined') {
      return next(callAction);
    }

    const hasErrors = validateAction(action);
    if (hasErrors.length) {
      // print errors
      hasErrors.forEach((e) => log.warn(e));
      // move on
      return next(callAction);
    }

    // process the action in reducers
    next(action);

    // VERB_ENDPOINT_STEP
    const [verb, endpoint] = action.type.split('_');

    try {
      // fetch
      const targetUrl = endpoints[endpoint];
      const url = resolveUrl(targetUrl, params);

      const response = await fetch(url, {
        method: methods[verb],
        headers: {
          ...DEFAULT_HEADERS,
          ...headers,
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      const payload = await response.json();
      // process the result
      return next({
        ...action,
        payload,
        type: `${verb}_${endpoint}_SUCCESS`,
      });
    } catch (error) {
      // process the error
      return next({
        ...action,
        error: error.message,
        type: `${verb}_${endpoint}_FAILURE`,
      });
    }
  };
}

export default middleware;
