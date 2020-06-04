/* eslint-disable no-console */
let count = 0;

const logger = (store) => (next) => (action) => {
  console.info(`\n${''.padEnd(50, '*')}`);
  console.info(`Action ${(count += 1)} \n`);
  console.info('Before: ', store.getState());
  console.info('');
  console.info('Dispatching action:');
  console.info(action);
  console.info('');
  const result = next(action);
  console.info('After', store.getState());
  console.info(`\n${''.padEnd(50, '*')}\n`);
  return result;
};

export default logger;
