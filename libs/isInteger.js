function isInteger(num) {
  return (num ^ 0) === num;
}

module.exports = isInteger;
