async function getMargin(contractSum, params) {
  return new Promise(async (resolve, reject) => {

    let margin = 0;
    let sub = 0;

    // = Add to sub P (debt) =
    sub += Number(params[1]);

    // = Add to sub salaryData and other cost =
    for (let i = 2; i < params.length; i++) {
      params[i].forEach((value) => {
        sub += Number(value);
      });
    }

    for (let c = 0; c < contractSum.length; c++) {
      if(contractSum[c][0] == params[0]) {
        margin = contractSum[c][1] - sub;
      }
    }

    resolve(margin);
  });

}

module.exports = getMargin;
