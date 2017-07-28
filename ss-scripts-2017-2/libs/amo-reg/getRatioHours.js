async function getRatioHours(salaryData, lawt, params, cutContractMonths, accruedIndex, CREW) {
  return new Promise(async (resolve, reject) => {

    const CTO = 'Заводов Павел';
    const MANAGER = 'Драниченко Максим';

    let sal = 0;
    let div = 0;
    let sum = [];
    let divider = 0;
    let dividers = [];
    let ratio = [];
    let ratioAll = [];
    let factHours = [];
    let factHoursAll = [];
    let months = [7, 8, 9, 10, 11, 12];

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
              && Number(lawt.table[n][t][0].substr(3,2)) == months[m]
              && lawt.table[n][t][2]) {
               divider += Number(lawt.table[n][t][2].replace(/,/g, '.'));
            }
          }
          dividers[n][1].push(Math.round(divider * 10000) / 10000);
        }
      }

      //= Build work hours of manager and tecnical director per month=

      let worksHours = {
        'manager': {
            'Интеграция (AMO)': 0,
            'Обслуживание (AMO)': 0,
            'Виджеты разработка (AMO)': 0,
            'Виджеты готовые (AMO)': 0,
            'Доп. работы (АМО)': 0
          },
        'cto': 0
      };

      for (let n = 0; n < lawt.name.length; n++) {
        for (let t = 0; t < lawt.table[n].length; t++) {

          if (lawt.name[n].trim() == MANAGER
            && lawt.table[n][t][2]) {

              switch(lawt.table[n][t][1].trim()) {
                case 'Интеграция (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][2].replace(/,/g, '.'));
                  break;
                case 'Обслуживание (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][2].replace(/,/g, '.'));
                  break;
                case 'Виджеты разработка (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][2].replace(/,/g, '.'));
                  break;
                case 'Виджеты готовые (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][2].replace(/,/g, '.'));
                  break;
                case 'Доп. работы (АМО)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][2].replace(/,/g, '.'));
                  break;
                default: break;
              }


          } else if (lawt.name[n].trim() == CTO
            && lawt.table[n][t][1].trim() == 'Виджеты разработка (AMO)'
            && lawt.table[n][t][2]) {
             worksHours.cto = Number(lawt.table[n][t][2].replace(/,/g, '.'));
          }
        }
      }

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

      //= Build quantinty of a projects =
      let quantityProjects = {
        'manager': {
          '7': {
            'Интеграция (AMO)': [],
            'Обслуживание (AMO)': [],
            'Виджеты разработка (AMO)': [],
            'Виджеты готовые (AMO)': [],
            'Доп. работы (АМО)': []
          },

          '8': {
            'Интеграция (AMO)': [],
            'Обслуживание (AMO)': [],
            'Виджеты разработка (AMO)': [],
            'Виджеты готовые (AMO)': [],
            'Доп. работы (АМО)': []
          },

          '9': {
            'Интеграция (AMO)': [],
            'Обслуживание (AMO)': [],
            'Виджеты разработка (AMO)': [],
            'Виджеты готовые (AMO)': [],
            'Доп. работы (АМО)': []
          },

          '10': {
            'Интеграция (AMO)': [],
            'Обслуживание (AMO)': [],
            'Виджеты разработка (AMO)': [],
            'Виджеты готовые (AMO)': [],
            'Доп. работы (АМО)': []
          },

          '11': {
            'Интеграция (AMO)': [],
            'Обслуживание (AMO)': [],
            'Виджеты разработка (AMO)': [],
            'Виджеты готовые (AMO)': [],
            'Доп. работы (АМО)': []
          },

          '12': {
            'Интеграция (AMO)': [],
            'Обслуживание (AMO)': [],
            'Виджеты разработка (AMO)': [],
            'Виджеты готовые (AMO)': [],
            'Доп. работы (АМО)': []

          }
        },
        'cto': {
          '7': [],
          '8': [],
          '9': [],
          '10': [],
          '11': [],
          '12': []
        }
      };

      let types = [
        'Интеграция (AMO)',
        'Обслуживание (AMO)',
        'Виджеты разработка (AMO)',
        'Виджеты готовые (AMO)',
        'Доп. работы (АМО)', //АМО - rus
      ];

      for (let i = 0; i < cutContractMonths.length; i++) {
        for (let j = 0; j < cutContractMonths[i].length; j++) {
          //= Filter 'Лицензии (AMO)'
          if (types.includes(params[3][i])) {
            quantityProjects.cto[cutContractMonths[i][j]]
            ? quantityProjects.cto[cutContractMonths[i][j]].push(cutContractMonths[i][j])
            : null;
          }
        }
      }

      for (let key in quantityProjects.cto) {
        quantityProjects.cto[key] = quantityProjects.cto[key].length;
      }

      for (let p = 0; p < cutContractMonths.length; p++) {
        for (let i = 0; i < cutContractMonths[p].length; i++) {
          for (let t = 0; t < types.length; t++) {
            if (cutContractMonths[p][i]
              && Object.getOwnPropertyNames(quantityProjects.manager[cutContractMonths[p][i]])[t]
              == params[3][p]) {
              quantityProjects.manager[cutContractMonths[p][i]][types[t]]
              ? quantityProjects.manager[cutContractMonths[p][i]][types[t]].push(cutContractMonths[p][i])
              : null;
            }
          }
        }
      }

      for (let key1 in quantityProjects.manager) {
        for (let key2 in quantityProjects.manager[key1]) {
          quantityProjects.manager[key1][key2] = quantityProjects.manager[key1][key2].length;
        }
      }

      //console.log(quantityProjects);

      //console.log(worksHours.manager);
      //console.log(quantityProjects.manager);

      //= Build factHours and warrentyHours =
      for (let m = 0; m < months.length ; m++) {
        factHours.push([]);

        for (let p = 0; p < params[1].length; p++) {
          factHours[m].push([]);

          for (let c = 0; c < CREW; c++) {
            factHours[m][p].push([]);
            let factHour = 0;

            for (let n = 0; n < lawt.name.length; n++) {

              if (params[0][c] && lawt.name[n] == params[0][c]) {

                for (var mm = 0; mm < cutContractMonths[p].length; mm++) {

                  if (cutContractMonths[p][mm] == months[m]) {
                    //= Build factHours for manager and cto =
                    if (lawt.name[n].trim() == MANAGER) {
                      let currMonth = cutContractMonths[p][mm];

                      //= Danger!!! may div by zero=

                      switch(params[3][p]) {
                        case 'Интеграция (AMO)':
                          factHour += Math.round(worksHours.manager[params[3][p]]
                          / quantityProjects.manager[currMonth][params[3][p]] * 10000) / 10000;
                          break;
                        case 'Обслуживание (AMO)':
                          factHour += Math.round(worksHours.manager[params[3][p]]
                          / quantityProjects.manager[currMonth][params[3][p]] * 10000) / 10000;
                          break;
                        case 'Виджеты разработка (AMO)':
                          factHour += Math.round(worksHours.manager[params[3][p]]
                          / quantityProjects.manager[currMonth][params[3][p]] * 10000) / 10000;
                          break;
                        case 'Виджеты готовые (AMO)':
                          factHour += Math.round(worksHours.manager[params[3][p]]
                          / quantityProjects.manager[currMonth][params[3][p]] * 10000) / 10000;
                          break;
                        case 'Доп. работы (АМО)':
                          factHour += Math.round(worksHours.manager[params[3][p]]
                          / quantityProjects.manager[currMonth][params[3][p]] * 10000) / 10000;
                          break;
                        default: break;

                        }

                    } else if (lawt.name[n].trim() == CTO) {
                      if (types.includes(params[3][p])) {
                        let currMonth = cutContractMonths[p][mm];
                          factHour += Math.round(worksHours.cto / quantityProjects.cto[currMonth] * 10000) / 10000;
                       }
                    } else {

                      //= Another employee
                      for (let t = 0; t < lawt.table[n].length; t++) {
                        if (lawt.table[n][t][0]
                          && types.includes(lawt.table[n][t][1])
                          && Number(lawt.table[n][t][0].substr(3, 2)) == params[1][p][mm]
                          && lawt.table[n][t][10] == params[2][p]
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

      //console.log(require('util').inspect(warrentyHours, { depth: null }));

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
