function normLength(srcRows){
  for (let i = 0; i < srcRows.length; i++) {
    if (srcRows[i][0] == '' &&
      srcRows[i + 1][0] == '' &&
      srcRows[i + 2][0] == '' &&
      srcRows[i + 3][0] == '' &&
      srcRows[i + 4][0] == '') {
      return srcRows.length = i;
    }
  }
}

module.exports = normLength;
