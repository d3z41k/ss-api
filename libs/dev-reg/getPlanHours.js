async function getPlanHours(normaHour, normaType, params) {
  return new Promise(async (resolve, reject) => {

    //console.log(params);

    let planHours = [];
    let ratio = [];
    let roles = [];

    try {

      for (let p = 0; p < params[0].length; p++) {
        for (let t = 0; t < normaType.length; t++) {
          if (params[0][p] == normaType[t][0]) {
            ratio.push(normaType[t][1].replace(/,/g, '.'));
          }
        }
        if (!params[0][p] || params[0][p] == 'Доп функционал по разработке') {
          ratio.push(0);
        }
      }

      for (let h = 0; h < normaHour.length; h++) {
        roles.push(normaHour[h][0]);
      }

      for (let p = 0; p < params[0].length; p++) {
        for (let r = 0; r < params[1].length; r++) {
          if (roles.includes(params[1][r])) { //check on existance role in norma
            for (let h = 0; h < normaHour.length; h++) {
              if (params[1][r] == normaHour[h][0]) {
                  planHours.push([Number(normaHour[h][1]) * Number(ratio[p])]);
              }
            }
          } else {
            planHours.push([]); //push "[]" if the role on existance in norma
          }
        }
        planHours.push([]); //for the "x" line
      }

    } catch (e) {
      reject(e.stack)
    }
    resolve(planHours);
  });

}

module.exports = getPlanHours;
