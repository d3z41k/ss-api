async function getRatioHours(salaryData, lawt, params, cutContractMonths, accruedIndex) {
  return new Promise(async (resolve, reject) => {

    const CREW = 11;
    let sal = 0;
    let div = 0;
    let sum = [];
    let divider = 0;
    let dividers = [];
    let ratio = [];
    let factHours = [];
    let warrentyHours = [];
    let months = [1, 2, 3, 4, 5, 6];

    //= Build the salaryData sum for each month =

    try {

      for (let p = 0; p < params[1].length; p++) {
        sum.push([]);
        for (let m = 0; m < params[1][p].length; m++) {
          sum[p].push([]);
          for (let i = 0; i < params[0].length; i++) {
            for (let s = 0; s < salaryData.length; s++) {
              if (salaryData[s][3] == params[0][i]) {
                sum[p][m].push(Number(salaryData[s][accruedIndex[params[1][p][m]]].replace(/\s/g, '')) ?
                  Number(salaryData[s][accruedIndex[params[1][p][m]]].replace(/\s/g, '')) : 0);
              }
            }
          }
        }
      }

    } catch (e) {
      reject(e.stack);
    }

    console.log(sum);

    // //= Build divider =
    // for (let n = 0; n < lawt.name.length; n++) {
    //   dividers.push([]);
    //   dividers[n].push(lawt.name[n]);
    //   dividers[n].push([]);
    //
    //   for (let m = 0; m < months.length; m++) {
    //     divider = 0;
    //     for (let t = 0; t < lawt.table[n].length; t++) {
    //       if (lawt.table[n][t][0]
    //         && Number(lawt.table[n][t][0].substr(3,2)) == months[m]
    //         && lawt.table[n][t][5] != '-'
    //         && lawt.table[n][t][5]) {
    //          divider += Number(lawt.table[n][t][5].replace(/,/g, '.'));
    //       }
    //     }
    //     dividers[n][1].push(Math.round(divider * 10000) / 10000);
    //   }
    // }
    //
    // console.log(dividers);
    //
    // //= Build work hours of manager and tecnical director per month=
    //
    // let worksHours = {
    //   'manager': 0,
    //   'tecDirector': 0
    // };
    //
    // for (let n = 0; n < lawt.name.length; n++) {
    //     for (let t = 0; t < lawt.table[n].length; t++) {
    //
    //       if (lawt.name[n].trim() == 'Сребняк Кирилл'
    //         && lawt.table[n][t][5]) {
    //          worksHours.manager = Number(lawt.table[n][t][5].replace(/,/g, '.'));
    //       } else if (lawt.name[n].trim() == 'Заводов Павел'
    //         && lawt.table[n][t][1].trim() == 'Разработка сайта'
    //         && lawt.table[n][t][5]) {
    //          worksHours.tecDirector = Number(lawt.table[n][t][5].replace(/,/g, '.'));
    //       }
    //     }
    // }
    //
    // //console.log(worksHours);
    //
    // //= Build ratio =
    //
    // for (let p = 0; p < params[0].length ; p++) {
    //   ratio.push([]);
    //   for (let m = 0; m < params[1][p].length; m++) {
    //     ratio[p].push([]);
    //     for (let c = 0; c < CREW; c++) {
    //       for (let d = 0; d < dividers.length; d++) {
    //         if (dividers[d][0] == params[0][p][c]) {
    //
    //           div = dividers[d][1][params[1][p][m] - 7];
    //           sal = sum[p][params[1][p][m] - params[1][p][0]][c] ? sum[p][params[1][p][m] - params[1][p][0]][c] : 0;
    //
    //           ratio[p][m].push(div ? Math.round(sal / div * 10000) / 10000 : 0);
    //
    //         }
    //       }
    //     }
    //   }
    // }
    //
    // //console.log(ratio);
    //
    // //= Build quantinty of a projects =
    // let quantityProjects = {
    //     '7': [],
    //     '8': [],
    //     '9': [],
    //     '10': [],
    //     '11': [],
    //     '12': [],
    // };
    //
    // for (let i = 0; i < cutContractMonths.length; i++) {
    //   for (let j = 0; j < cutContractMonths[i].length; j++) {
    //       quantityProjects[cutContractMonths[i][j]].push(cutContractMonths[i][j]);
    //   }
    // }
    //
    // for (let key in quantityProjects) {
    //   quantityProjects[key] = quantityProjects[key].length;
    // }
    //
    // //console.log(quantityProjects);
    //
    // //= Build factHours and warrentyHours =
    //
    // for (let p = 0; p < params[0].length ; p++) {
    //   factHours.push([]);
    //   warrentyHours.push([]);
    //   for (let m = 0; m < params[1][p].length; m++) {
    //     factHours[p].push([]);
    //     warrentyHours[p].push([]);
    //     for (let c = 0; c < CREW; c++) {
    //       let factHour = 0;
    //       let warrentyHour = 0;
    //
    //       for (let n = 0; n < lawt.name.length; n++) {
    //
    //         if (lawt.name[n] == params[0][p][c]) {
    //
    //           //= Build factHours for manager and tecnical director =
    //           if (lawt.name[n].trim() == 'Сребняк Кирилл') {
    //             if (cutContractMonths[p][m]) {
    //               let currMonth = cutContractMonths[p][m];
    //               factHour += Math.round(worksHours.manager / quantityProjects[currMonth] * 10000) / 10000;
    //             }
    //           } else if (lawt.name[n].trim() == 'Заводов Павел') {
    //             if (cutContractMonths[p][m]) {
    //               let currMonth = cutContractMonths[p][m];
    //               factHour += Math.round(worksHours.tecDirector / quantityProjects[currMonth] * 10000) / 10000;
    //             }
    //           } else {
    //
    //             //= Another employee
    //             if (cutContractMonths[p][m]) {
    //
    //               for (let t = 0; t < lawt.table[n].length; t++) {
    //                 if (lawt.table[n][t][0]
    //                   && Number(lawt.table[n][t][0].substr(3,2)) == params[1][p][m]
    //                   && lawt.table[n][t][2] == params[2][p]
    //                   && lawt.table[n][t][5].trim() != '-'
    //                   && lawt.table[n][t][1].trim() == 'Разработка сайта'
    //                   && lawt.table[n][t][5]) {
    //                     factHour += Number(lawt.table[n][t][5].replace(/,/g, '.'));
    //                 }
    //               }
    //
    //             } else {
    //
    //               for (let t = 0; t < lawt.table[n].length; t++) {
    //                 if (lawt.table[n][t][0]
    //                   && Number(lawt.table[n][t][0].substr(3,2)) == params[1][p][m]
    //                   && lawt.table[n][t][2] == params[2][p]
    //                   && lawt.table[n][t][5].trim() != '-'
    //                   && lawt.table[n][t][1].trim() == 'Разработка сайта'
    //                   && lawt.table[n][t][5]) {
    //                     warrentyHour += Number(lawt.table[n][t][5].replace(/,/g, '.'));
    //                 }
    //               }
    //
    //             }
    //           }
    //         }
    //       }
    //
    //       factHours[p][m].push(Math.round(factHour * 10000) / 10000);
    //       warrentyHours[p][m].push(Math.round(warrentyHour * 10000) / 10000);
    //
    //     }
    //   }
    // }


   resolve('[ratio, factHours, warrentyHours]');

  });
}

module.exports = getRatioHours;
