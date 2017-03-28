async function getMargin(contractSum, params) {
  return new Promise(async (resolve, reject) => {

    let margin = 0;
    let sub = 0;

    try {

      // = Add to sub P (debt) =
      sub += Number(params[1]);

      // = Add to sub salary and other cost =
      for (let i = 2; i < params.length; i++) {
        params[i].forEach(value => {
          sub += Number(value);
        })
      }

      for (let c = 0; c < contractSum.length; c++) {
        if(contractSum[c][0] == params[0]) {
          margin = contractSum[c][1] - sub;
        }
      }
    } catch (e) {
      reject(e.stack);
    }
    resolve(margin);

  });
}

module.exports = getMargin;
