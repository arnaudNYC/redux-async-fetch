const LEVEL = {
  off: 5,
  fatal: 4,
  error: 3,
  warn: 2,
  info: 1,
  debug: 0,
};

function print(maxLevel, currentLevel, msg) {
  if (LEVEL[maxLevel] <= LEVEL[currentLevel]) {
    // eslint-disable-next-line no-console
    console[currentLevel]('[redux-async-fetch]: ', ...msg);
  }
}

function logger(level = 'off') {
  return {
    debug: (...msg) => print(level, 'debug', msg),
    error: (...msg) => print(level, 'error', msg),
    fatal: (...msg) => print(level, 'error', msg),
    info: (...msg) => print(level, 'info', msg),
    warn: (...msg) => print(level, 'warn', msg),
  };
}

export default logger;
