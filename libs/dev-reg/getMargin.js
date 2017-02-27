async function getMargin(contractSum, params) {
  return new Promise(async (resolve, reject) => {

    let margin = [];
    let sub = [];

    try {

      for (let m = 0; m < params[2].length; m++) {
        for (let x = 0; x < params[2][m].length; x++) {
          params[2][m][x] = params[2][m][x].reduce((sum, current) => {
            return sum + current;
          });
          params[3][m][x] = params[3][m][x].reduce((sum, current) => {
            return sum + current;
          });
          params[4][m][x] = params[4][m][x].reduce((sum, current) => {
            return sum + current;
          });
        }
      }

      for (let p = 0; p < params[0].length; p++) {
        margin.push([]);
        sub.push([]);
        sub[p] = params[1][p];

        for (let m = 0; m < params[2].length; m++) {
          sub[p] += params[2][m][p];
          sub[p] += params[3][m][p];
          sub[p] += params[4][m][p];
        }

        for (let c = 0; c < contractSum.length; c++) {
          if(contractSum[c][0] == params[0][p]) {
            margin[p].push(contractSum[c][1] - sub[p]);
          }
        }

      }

    } catch (e) {
      reject(e.stack);
    }

    resolve(margin);
  });

}

module.exports = getMargin;
