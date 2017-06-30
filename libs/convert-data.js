function convertData(date) {
  const YEAR = 2017;
  if (date[0].length == 1) {
    date[0] = '0' + date[0];
  }
  if (date[1].length == 1) {
    date[1] = '0' + date[1];
  }
  return date[0] + '.' + date[1] + '.' + YEAR;
}

module.exports = convertData;
