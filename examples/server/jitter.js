function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = (req, res, next) => setTimeout(next, getRandomInt(5000));
