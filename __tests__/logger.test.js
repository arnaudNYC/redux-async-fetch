/* eslint-disable no-console */
import Logger from '../src/logger';

describe('#logger', () => {
  beforeAll(() => {
    global.console = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    };
  });
  afterEach(() => {
    console.warn.mockClear();
  });

  describe('when the logger is on', () => {
    it('should log', () => {
      const logger = new Logger('info');
      const m = 'foo';
      logger.debug(m);
      expect(console.debug).toHaveBeenCalledTimes(0);

      logger.info(m);
      expect(console.info).toHaveBeenCalledTimes(1);

      logger.warn(m);
      expect(console.warn).toHaveBeenCalledTimes(1);

      logger.error('foo', 'bar');
      logger.fatal();
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        '[redux-async-fetch]: ',
        'foo',
        'bar',
      );
    });
  });
  describe('when the logger is off', () => {
    it('should not log', () => {
      const mutedLogger = new Logger();
      mutedLogger.warn('hi');
      expect(console.warn).toHaveBeenCalledTimes(0);
    });
  });
});
