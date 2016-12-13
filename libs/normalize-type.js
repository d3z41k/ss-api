function normType(srcNormaType) {
  let normaType = [];
  let count = 0;

  for (let i = 0; i < (srcNormaType.length - 1); i++) {
    if (srcNormaType[i][0] == srcNormaType[i + 1][0]) {
      normaType.push([]);
      normaType[count].push(srcNormaType[i][0]);
      normaType[count].push(srcNormaType[i][3] ? srcNormaType[i][3] : srcNormaType[i + 1][3]);
      count++;
    }
  }
  return normaType;
}

module.exports = normType;
