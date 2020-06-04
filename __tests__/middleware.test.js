import middleware, { CALL_API } from '../src';

const mockLogger = {
  warn: jest.fn(),
};

jest.mock('../src/logger', () => () => {
  return mockLogger;
});

describe('#redux-async-fetch', () => {
  const next = jest.fn();
  const options = { logLevel: 'debug' };
  const sut = middleware(
    {
      ACTION: '/svc',
      FOO: '/foo?id=1',
    },
    options,
  )();

  beforeEach(() => {
    next.mockClear();
    global.fetch.mockClear();
    mockLogger.warn.mockClear();
  });

  describe('when the api call succeeds', () => {
    beforeAll(() => {
      global.fetch = jest.fn(() => new Promise((r) => r({ json() {} })));
    });
    it('should pass a REQUEST followed by a SUCCESS action', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_ACTION_REQUEST',
        },
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_REQUEST' });
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_SUCCESS' });
      expect(fetch).toHaveBeenCalledWith('/svc', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
    });
    it('should append parameters to the url', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_ACTION_REQUEST',
        },
        params: '/1',
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_REQUEST' });
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_SUCCESS' });
      expect(fetch).toHaveBeenCalledWith('/svc/1', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
    });
    it('should append query parameters', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_ACTION_REQUEST',
        },
        params: { id: 10 },
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_REQUEST' });
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_SUCCESS' });
      expect(fetch).toHaveBeenCalledWith('/svc?id=10', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
    });
    it('should append object query parameters to existing parameters', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_FOO_REQUEST',
        },
        params: { bar: 10 },
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_FOO_REQUEST' });
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_FOO_SUCCESS' });
      expect(fetch).toHaveBeenCalledWith('/foo?id=1&bar=10', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
    });
    it('should append string query parameters to existing parameters', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_FOO_REQUEST',
        },
        params: '&bar=10',
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_FOO_REQUEST' });
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_FOO_SUCCESS' });
      expect(fetch).toHaveBeenCalledWith('/foo?id=1&bar=10', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
      expect(next).toHaveBeenCalledTimes(2);
    });
    it('should ignore invalid query parameters', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_FOO_REQUEST',
        },
        params: 1,
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_FOO_REQUEST' });
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_FOO_SUCCESS' });
      expect(fetch).toHaveBeenCalledWith('/foo?id=1', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
    });
  });

  describe('when the api call fails', () => {
    beforeAll(() => {
      global.fetch = jest.fn(() => new Promise((_, r) => r(new Error('ko'))));
    });
    it('should pass a REQUEST followed by a FAILURE action', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_ACTION_REQUEST',
        },
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_REQUEST' });
      expect(next).toHaveBeenCalledWith({
        type: 'LOAD_ACTION_FAILURE',
        error: 'ko',
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('when no endpoints are provided', () => {
    it('should not make an api call', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_ACTION_REQUEST',
        },
      };
      const badMW = middleware(undefined)();
      await badMW(next)(action);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(action);
      expect(fetch).toHaveBeenCalledTimes(0);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('when the action is not a CALL_API action', () => {
    it('should not call the api', async () => {
      const action = {
        type: 'LOAD_ACTION_REQUEST',
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith({ type: 'LOAD_ACTION_REQUEST' });
      expect(fetch).toHaveBeenCalledTimes(0);
    });
  });

  describe('when the method cannot be matched', () => {
    it('should continue with a warning', async () => {
      const action = {
        [CALL_API]: { type: 'BAD_ACTION_REQUEST' },
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith({
        [CALL_API]: { type: 'BAD_ACTION_REQUEST' },
      });
      expect(fetch).toHaveBeenCalledTimes(0);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('when an action is dispatched', () => {
    beforeAll(() => {
      global.fetch = jest.fn(() => new Promise((r) => r({ json() {} })));
    });
    const assertVerbMatchesAction = async (prefix, method) => {
      const action = {
        [CALL_API]: {
          type: `${prefix}_ACTION_REQUEST`,
        },
        body: {
          name: 'foo',
        },
        headers: {
          foo: 'bar',
        },
        params: {
          id: 1,
        },
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledWith({ type: `${prefix}_ACTION_REQUEST` });
      expect(next).toHaveBeenCalledWith({ type: `${prefix}_ACTION_SUCCESS` });
      expect(fetch).toHaveBeenCalledWith('/svc?id=1', {
        headers: { 'Content-Type': 'application/json', foo: 'bar' },
        method,
        body: JSON.stringify({ name: 'foo' }),
      });
    };

    // LOAD
    describe('when it is a LOAD REQUEST', () => {
      it('should GET', async () => {
        assertVerbMatchesAction('LOAD', 'GET');
      });
    });

    // POST
    describe('when it is a CREATE REQUEST', () => {
      it('should POST', async () => {
        assertVerbMatchesAction('CREATE', 'POST');
      });
    });

    // DELETE
    describe('when it is a DELETE REQUEST', () => {
      it('should POST', async () => {
        assertVerbMatchesAction('DELETE', 'DELETE');
      });
    });

    // PATCH
    describe('when it is a UPDATE REQUEST', () => {
      it('should PATCH', async () => {
        assertVerbMatchesAction('UPDATE', 'PATCH');
      });
    });

    // PUT
    describe('when it is a MODIFY REQUEST', () => {
      it('should PUT', async () => {
        assertVerbMatchesAction('MODIFY', 'PUT');
      });
    });
  });

  describe('when validating an action', () => {
    it('should ignore other actions', async () => {
      const action = {
        type: {},
      };
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(action);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    const assertAction = async (action) => {
      await sut(next)(action);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(action);
      expect(mockLogger.warn).toHaveBeenCalled();
    };

    it('should ignore missing types', async () => {
      const action = {
        [CALL_API]: {},
      };
      assertAction(action);
    });
    it('should ignore a malformed action type', async () => {
      const action = {
        [CALL_API]: {
          type: `FOO`,
        },
      };
      assertAction(action);
    });
    it('should ignore an unsupported verb', async () => {
      const action = {
        [CALL_API]: {
          type: 'FOO_ACTION_REQUEST',
        },
      };
      assertAction(action);
    });
    it('should ignore an unknown endpoint', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_UNKNOWN_REQUEST',
        },
      };
      assertAction(action);
    });
    it('should ignore an unknown step', async () => {
      const action = {
        [CALL_API]: {
          type: 'LOAD_ACTION_FOO',
        },
      };
      assertAction(action);
    });
  });
});
