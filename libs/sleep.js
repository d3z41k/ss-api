async function sleep(ms = 0) {
  return new Promise(reject => setTimeout(reject, ms));
}

module.exports = sleep;
