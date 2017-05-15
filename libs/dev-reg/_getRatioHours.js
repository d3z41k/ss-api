async function getRatioHours(salaryData, lawt, params, cutContractMonths, accruedIndex, CREW) {
  return new Promise(async (resolve, reject) => {

    const DIRECTION = 'Разработка сайта';
    const CTO = 'Заводов Павел';
    const MANAGER = 'Сребняк Кирилл';

    let sal = 0;
    let div = 0;
    let sum = [];
    let divider = 0;
    let dividers = [];
    let ratio = [];
    let ratioAll = [];
    let factHours = [];
    let factHoursAll = [];
    let months = [1, 2, 3, 4, 5, 6];

    //= Build the salaryData sum for each month =

    try {

      for (let m = 0; m < months.length; m++) {
        sum.push([]);
        for (let i = 0; i < params[0].length; i++) {
          for (let s = 0; s < salaryData.length; s++) {
            if (params[0][i] && salaryData[s][1] == params[0][i]) {
              sum[m].push(Number(salaryData[s][accruedIndex[months[m]]].replace(/\s/g, '')) ?
                Number(salaryData[s][accruedIndex[months[m]]].replace(/\s/g, '')) : 0);
            }
          }
        }
      }

      //= Build divider =
      for (let n = 0; n < lawt.name.length; n++) {
        dividers.push([]);
        dividers[n].push(lawt.name[n]);
        dividers[n].push([]);

        for (let m = 0; m < months.length; m++) {
          divider = 0;
          for (let t = 0; t < lawt.table[n].length; t++) {
            if (lawt.table[n][t][0]
              && Number(lawt.table[n][t][0].substr(3, 2)) == months[m]
              && lawt.table[n][t][2]) {
               divider += Number(lawt.table[n][t][2].replace(/,/g, '.'));
            }
          }
          dividers[n][1].push(Math.round(divider * 10000) / 10000);
        }
      }

      //console.log(dividers);

      //= Build work hours of manager and tecnical director per month=

      let worksHours = {
        'manager': 0,
        'cto': 0
      };

      for (let n = 0; n < lawt.name.length; n++) {
        for (let t = 0; t < lawt.table[n].length; t++) {

          if (lawt.name[n].trim() == MANAGER
            && lawt.table[n][t][2]) {
             worksHours.manager = Number(lawt.table[n][t][2].replace(/,/g, '.'));
          } else if (lawt.name[n].trim() == CTO
            && lawt.table[n][t][1].trim() == DIRECTION
            && lawt.table[n][t][2]) {
             worksHours.cto = Number(lawt.table[n][t][2].replace(/,/g, '.'));
          }
        }
      }

      //console.log(worksHours);

      //= Build ratio =
      for (let m = 0; m < months.length; m++) {
        ratio.push([]);
          for (let d = 0; d < dividers.length; d++) {
            div = dividers[d][1][months[m] - 1];
            sal = sum[m][d];
            ratio[m].push(div ? Math.round(sal / div * 10000) / 10000 : 0);
          }
      }

      ratio.forEach(line => {
        for (let c = line.length; c < CREW; c++) {
          line.push(0);
        }
      });

      //console.log(ratio);

      //= Build quantinty of a projects =
      let quantityProjects = {
          '1': [],
          '2': [],
          '3': [],
          '4': [],
          '5': [],
          '6': [],
      };

      for (let i = 0; i < cutContractMonths.length; i++) {
        for (let j = 0; j < cutContractMonths[i].length; j++) {
            quantityProjects[cutContractMonths[i][j]]
            ? quantityProjects[cutContractMonths[i][j]].push(cutContractMonths[i][j])
            : null;
        }
      }

      for (let key in quantityProjects) {
        quantityProjects[key] = quantityProjects[key].length;
      }

      //console.log(params[1]);

      //= Build factHours =
      for (let m = 0; m < months.length ; m++) {
        factHours.push([]);

        for (let p = 0; p < params[2].length; p++) {
          factHours[m].push([]);

          for (let c = 0; c < CREW; c++) {
            factHours[m][p].push([]);
            let factHour = 0;

              for (let n = 0; n < lawt.name.length; n++) {

                if (params[0][c] && lawt.name[n] == params[0][c]) {

                  for (var mm = 0; mm < cutContractMonths[p].length; mm++) {

                    if (cutContractMonths[p][mm] == months[m]) {
                      //= Build factHours for manager and tecnical director =
                      if (lawt.name[n].trim() == MANAGER) {
                        let currMonth = cutContractMonths[p][mm];
                        factHour += Math.round(worksHours.manager / quantityProjects[currMonth] * 10000) / 10000;
                      } else if (lawt.name[n].trim() == CTO) {
                        let currMonth = cutContractMonths[p][mm];
                        factHour += Math.round(worksHours.cto / quantityProjects[currMonth] * 10000) / 10000;
                      } else {

                        //= Another employee
                        for (let t = 0; t < lawt.table[n].length; t++) {
                          if (lawt.table[n][t][0]
                            && Number(lawt.table[n][t][0].substr(3, 2)) == params[1][p][mm]
                            && lawt.table[n][t][5] == params[2][p] //site (project name)
                            && lawt.table[n][t][1].trim() == DIRECTION
                            && lawt.table[n][t][2]) {
                              factHour += Number(lawt.table[n][t][2].replace(/,/g, '.'));
                          }
                        }
                      }
                    }
                  }

                }
              }

              factHours[m][p][c].push(Math.round(factHour * 10000) / 10000);

          }
        }
      }

      //console.log(require('util').inspect(factHours, { depth: null }));

      ratio.forEach((crew, m) => {
        ratioAll.push([]);
        for (let p = 0; p < params[1].length; p++) {
          crew.forEach(ratio => {
            ratioAll[m].push([ratio]);
          });
          ratioAll[m].push([]);
        }
      });

      factHours.forEach((monthFactHours, m) => {
        factHoursAll.push([]);
        monthFactHours.forEach(crewFactHours => {
          crewFactHours.forEach(FactHours => {
            factHoursAll[m].push(FactHours);
          });
          factHoursAll[m].push([]);
        });
      });

    } catch (e) {
      reject(e.stack);
    }

    resolve([ratioAll, factHoursAll]);
  });
}

module.exports = getRatioHours;
