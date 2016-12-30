'use strict';

const config = require('config');

async function getRatio(salary, lawt, params, cutContractMonths) {
  return new Promise(async(resolve, reject) => {

    if (!salary || !lawt || !params) {
      reject('Empty arguments!');
    }

    const CREW = 7;
    let sal = 0;
    let div = 0;
    let sum = [];
    let divider = 0;
    let dividers = [];
    let ratio = [];
    let factHours = [];
    let warrentyHours = [];
    let months = [7, 8, 9, 10, 11, 12];

    //console.log(params[2][1][1]);

    //= The Numbers of cols in Salary
    let ratioMonth = config.ratioMonth;

    //= Build the salary sum for each month =

    for (let p = 0; p < params[0].length; p++) {
      sum.push([]);
      for (let m = 0; m < params[1][p].length; m++) {
        sum[p].push([]);
        for (let i = 0; i < params[0][p].length; i++) {
          for (let s = 0; s < salary.length; s++) {
            if (salary[s][3] == params[0][p][i]) {
              sum[p][m].push(Number(salary[s][ratioMonth[params[1][p][m]]].replace(/\s/g, '')) ?
                Number(salary[s][ratioMonth[params[1][p][m]]].replace(/\s/g, '')) : 0);
            }
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
            && lawt.table[n][t][5]) {
             divider += Number(lawt.table[n][t][5].replace(/,/g, '.'));
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
      'tecDirector': 0
    };


    for (let n = 0; n < lawt.name.length; n++) {
        for (let t = 0; t < lawt.table[n].length; t++) {

          if (lawt.name[n].trim() == 'Драниченко Максим'
            && lawt.table[n][t][5]) {

              switch(lawt.table[n][t][1].trim()) {
                case 'Интеграция (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][5].replace(/,/g, '.'));
                  break;
                case 'Обслуживание (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][5].replace(/,/g, '.'));
                  break;
                case 'Виджеты разработка (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][5].replace(/,/g, '.'));
                  break;
                case 'Виджеты готовые (AMO)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][5].replace(/,/g, '.'));
                  break;
                case 'Доп. работы (АМО)':
                  worksHours.manager[lawt.table[n][t][1]] = Number(lawt.table[n][t][5].replace(/,/g, '.'));
                  break;
                default: break;
              }

          } else if (lawt.name[n].trim() == 'Заводов Павел'
            && lawt.table[n][t][1].trim() == 'Виджеты разработка (AMO)'
            && lawt.table[n][t][5]) {
             worksHours.tecDirector = Number(lawt.table[n][t][5].replace(/,/g, '.'));
          }
        }
    }

    //console.log(worksHours);

    //= Build ratio =
    for (let p = 0; p < params[0].length ; p++) {
      ratio.push([]);
      for (let m = 0; m < params[1][p].length; m++) {
        ratio[p].push([]);
        for (let c = 0; c < CREW; c++) {
          for (let d = 0; d < dividers.length; d++) {
            if (dividers[d][0] == params[0][p][c]) {

              div = dividers[d][1][params[1][p][m] - 7];
              sal = sum[p][params[1][p][m] - params[1][p][0]][c] ? sum[p][params[1][p][m] - params[1][p][0]][c] : 0;

              ratio[p][m].push(div ? Math.round(sal / div * 10000) / 10000 : 0);

            }
          }
        }
      }
    }

    //console.log(ratio);

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

      'tecDirector': {
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
      'Доп. работы (АМО)',
    ];

    for (let p = 0; p < cutContractMonths.length; p++) {
      for (let i = 0; i < cutContractMonths[p].length; i++) {
        //= Filter 'Лицензии (AMO)'
        if (types.includes(params[2][p][1])) {
          quantityProjects.tecDirector[cutContractMonths[p][i]].push(cutContractMonths[p][i]);
        }
      }
    }

    for (let key in quantityProjects.tecDirector) {
      quantityProjects.tecDirector[key] = quantityProjects.tecDirector[key].length;
    }

    //console.log(Object.getOwnPropertyNames(quantityProjects.manager[7])[0]);

    for (let p = 0; p < cutContractMonths.length; p++) {
      for (let i = 0; i < cutContractMonths[p].length; i++) {
        for (let t = 0; t < types.length; t++) {
          if (Object.getOwnPropertyNames(quantityProjects.manager[cutContractMonths[p][i]])[t]
            == params[2][p][1]) {
            quantityProjects.manager[cutContractMonths[p][i]][types[t]].push(cutContractMonths[p][i]);
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

    //= Build factHours and warrentyHours =

    for (let p = 0; p < params[0].length ; p++) {
      factHours.push([]);
      warrentyHours.push([]);
      for (let m = 0; m < params[1][p].length; m++) {
        factHours[p].push([]);
        warrentyHours[p].push([]);
        for (let c = 0; c < CREW; c++) {
          let factHour = 0;
          let warrentyHour = 0;
          for (let n = 0; n < lawt.name.length; n++) {

            if (lawt.name[n] == params[0][p][c]) {

              //= Build factHours for manager =
              if (lawt.name[n].trim() == 'Драниченко Максим') {
                if (cutContractMonths[p][m]) {
                  let currMonth = cutContractMonths[p][m];

                  //= Danger!!! may div by zero=

                    switch(params[2][p][1]) {
                      case 'Интеграция (AMO)':
                        factHour += Math.round(worksHours.manager[params[2][p][1]]
                        / quantityProjects.manager[currMonth][params[2][p][1]] * 10000) / 10000;
                        break;
                      case 'Обслуживание (AMO)':
                        factHour += Math.round(worksHours.manager[params[2][p][1]]
                        / quantityProjects.manager[currMonth][params[2][p][1]] * 10000) / 10000;
                        break;
                      case 'Виджеты разработка (AMO)':
                        factHour += Math.round(worksHours.manager[params[2][p][1]]
                        / quantityProjects.manager[currMonth][params[2][p][1]] * 10000) / 10000;
                        break;
                      case 'Виджеты готовые (AMO)':
                        factHour += Math.round(worksHours.manager[params[2][p][1]]
                        / quantityProjects.manager[currMonth][params[2][p][1]] * 10000) / 10000;
                        break;
                      case 'Доп. работы (АМО)':
                        factHour += Math.round(worksHours.manager[params[2][p][1]]
                        / quantityProjects.manager[currMonth][params[2][p][1]] * 10000) / 10000;
                        break;
                      default: break;

                  }
                }
              } else if (lawt.name[n].trim() == 'Заводов Павел') {
                if (cutContractMonths[p][m]
                  && types.includes(params[2][p][1])) {
                  let currMonth = cutContractMonths[p][m];
                    factHour += Math.round(worksHours.tecDirector / quantityProjects.tecDirector[currMonth] * 10000) / 10000;
                 }
              } else {
                //= Another employee
                if (cutContractMonths[p][m]) {
                  for (let t = 0; t < lawt.table[n].length; t++) {
                    if (lawt.table[n][t][0]
                      && Number(lawt.table[n][t][0].substr(3,2)) == params[1][p][m]
                      && lawt.table[n][t][4] == params[2][p][0]
                      && lawt.table[n][t][5].trim() != '-'
                      //&& lawt.table[n][t][1].trim() == 'Разработка сайта'
                      && lawt.table[n][t][5]) {
                        factHour += Number(lawt.table[n][t][5].replace(/,/g, '.'));
                    }

                  }
                } else {
                  for (let t = 0; t < lawt.table[n].length; t++) {
                    if (lawt.table[n][t][0]
                      && Number(lawt.table[n][t][0].substr(3,2)) == params[1][p][m]
                      && lawt.table[n][t][4] == params[2][p][0]
                      && lawt.table[n][t][5].trim() != '-'
                      //&& lawt.table[n][t][1].trim() == 'Разработка сайта'
                      && lawt.table[n][t][5]) {
                        warrentyHour += Number(lawt.table[n][t][5].replace(/,/g, '.'));
                    }
                  }

                }
              }
            }
          }
           factHours[p][m].push(Math.round(factHour * 10000) / 10000);
           warrentyHours[p][m].push(Math.round(warrentyHour * 10000) / 10000);
        }
      }
    }

   //console.log(warrentyHours);

   resolve([ratio, factHours, warrentyHours]);

  });
}

async function getMargin(contractSum, params) {
  return new Promise(async (resolve, reject) => {

    let margin = 0;
    let sub = 0;

    // =Add to sub P (debt) =
    sub += Number(params[1]);

    // = Add to sub salary and other cost =
    for (let i = 2; i < params.length; i++) {
      params[i].forEach((value) => {
        sub += Number(value);
      })
    }

    for (var c = 0; c < contractSum.length; c++) {
      if(contractSum[c][0] == params[0]) {
        margin = contractSum[c][1] - sub;
      }
    }

    resolve(margin);
  });

}

//--------------------------------------------------------------------------
// Main function
//--------------------------------------------------------------------------

async function amoReg() {
  return new Promise(async (resolve, reject) => {

    console.log('START: ' + new Date());

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normLength = require('../libs/normalize-length');
    const sleep = require('../libs/sleep');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const amoRegQuery = require('../models/db_amo-reg-query');
    let abc = require('../libs/abc')();

    async function start(auth) {

      const crud = new Crud(auth);

      const CREW = 7;
      const START = 11;
      const YEAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      let list = '';
      let range = '';

      // //= Get months cols for develope registry =
      const colMonths = config.reg_colMonths;
      let cols = '';

      //------------------------------------------------------------------------
      // Get Project length (Build xArray)
      //------------------------------------------------------------------------

      list = encodeURIComponent('AMO (реестр)');
      range = list + '!A1:A';
      let xLable = await crud.readData(config.ssId.amo, range);
      let xArray = [];

     try {

        xLable.forEach((value, x) => {
          if (value == 'x') {
            xArray.push(x + 2);
          }
        });

        xArray.pop();
        xArray.unshift(START);

      } catch (e) {
        console.log(e.stack);
      }

      //------------------------------------------------------------------------
      // Get data from 'Registry'
      //------------------------------------------------------------------------

      range = list + '!C11:DI';

      let registry = await crud.readData(config.ssId.amo, range);

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (AMO)');
      range = list + '!B5:U';

      let clientInfo = await crud.readData(config.ssId.amo, range);

      let contractSum = clientInfo.map((row) => {
        return [
          row[0],
          row[10] && Number(row[10].replace(/\s/g, ''))
          ? Number(row[10].replace(/\s/g, '')) : 0
        ]
      });

      //console.log(contractSum);

      //------------------------------------------------------------------------
      // Get "Action months"
      //------------------------------------------------------------------------

      let actionMonth = [];

      for (let x = 0; x < xArray.length; x++) {
        actionMonth.push([]);
        for (let i = 0; i < clientInfo.length; i++) {
          if (registry[xArray[x] - START][0]  == clientInfo[i][0]) {
            actionMonth[x].push(clientInfo[i][7] ? Number(clientInfo[i][7].slice(3,5)) : 6);
            actionMonth[x].push(clientInfo[i][11] ? Number(clientInfo[i][11].slice(3,5)) : 12);
          }
        }
        actionMonth[x].length = 2;
      }

      //console.log(actionMonth);

      //---------------------------------------------------------------
      // Get Actual months for a projects
      //---------------------------------------------------------------

      let actionMonths = [];
      let contractMonths = [];

      actionMonth.forEach((months) => {
          actionMonths.push(YEAR.slice(months[0]));
          contractMonths.push(YEAR.slice(months[0], months[1] + 1));
      });

      let cutActionMonths = [];
      let cutContractMonths = [];

      actionMonths.forEach((months) => {
        let line = months.filter((month) => {
          return month >= 7;
        });
        cutActionMonths.push(line);
      });

      contractMonths.forEach((months) => {
        let line = months.filter((month) => {
          return month >= 7;
        });
        cutContractMonths.push(line);
      });

      cutContractMonths.forEach((value, i) => {
        if (!value[0]) {
            cutContractMonths[i] = [7];
        }
      });

      //--------------------------------------------------------------------------
      // Get & Insert mounth and amount of the act
      //--------------------------------------------------------------------------

      // let monthAct = clientInfo.map((row) => {
      //   return [
      //     row[0],
      //     row[11] ? row[11] : 0,
      //     row[10] && Number(row[10].replace(/\s/g, ''))
      //     ? Number(row[10].replace(/\s/g, '')) : 0
      //   ];
      // });
      //
      // let colsAct = config.reg_colsAct;
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   let month = 0;
      //
      //   for (let i = 0; i < monthAct.length; i++) {
      //     if (registry[xArray[x] - START][0]  == monthAct[i][0]) {
      //       if (monthAct[i][1]) {
      //         month = Number(monthAct[i][1].substr(3, 2)) > 6 ? Number(monthAct[i][1].substr(3, 2)) : 7;
      //       } else {
      //         month = '';
      //       }
      //
      //       list = encodeURIComponent('AMO (реестр)');
      //       range = list + '!H' + xArray[x];
      //
      //       await crud.updateData([[month]], config.ssId.amo, range)
      //         .then(async result => {console.log(result);})
      //         .catch(console.err);
      //
      //       if (colsAct[month]) {
      //         range = list + '!' + colsAct[month] + xArray[x];
      //
      //         await crud.updateData([[monthAct[i][2]]], config.ssId.amo, range)
      //           .then(async result => {console.log(result);})
      //           .catch(console.err);
      //         await sleep(500);
      //       }
      //
      //     }
      //   }
      //
      //   console.log('Project: ' + x);
      //
      // }
      // console.log(new Date());
      // console.log('* Get & Insert mounth and amount of the act *');

      //------------------------------------------------------------------------
      // The receipt of money from customers (prepaid & finally)
      //------------------------------------------------------------------------

      // let srcRows = [];
      // list = encodeURIComponent('ДДС_Лера');
      // range = list + '!A6:AC';
      //
      // srcRows = await crud.readData(config.ssId.dds, range);
      //
      // // = Normalizing of length "srcRows" =
      // normLength(srcRows);
      //
      // await dbRefresh(pool, 'dds_lera', srcRows)
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.err);

      //---------------------------------------------------------------
      // Build receiptParams The receipt of money from customers (prepaid & finalLy)
      //---------------------------------------------------------------

      // list = encodeURIComponent('AMO (реестр)');
      // let receiptParams = [[], [[],[]], [], [], []];
      // let value = [];
      //
      // receiptParams[1][0] = 'Поступление денег от клиентов (предоплата)';
      // receiptParams[1][1] = 'Поступление от клиентов (оконч. оплата)';
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   receiptParams[0] = [];
      //   receiptParams[2] = [];
      //   receiptParams[3] = [];
      //   receiptParams[4] = [];
      //   cols = [[], []];
      //
      //   receiptParams[0].push(registry[xArray[x] - START][4]);
      //   receiptParams[3].push(registry[xArray[x] - START][0]);
      //   receiptParams[4].push(registry[xArray[x] - START][1]);
      //
      //   for (let m = 0; m < cutActionMonths[x].length; m++) {
      //     receiptParams[2].push(cutActionMonths[x][m]);
      //     cols[0] = cols[0].concat(colMonths[cutActionMonths[x][m]].slice(0, 2));
      //     cols[1] = cols[1].concat(colMonths[cutActionMonths[x][m]].slice(2, 4));
      //   }
      //
      //   let values = await amoRegQuery(pool, 'dds_lera', receiptParams);
      //
      //   for (let c = 0; c < cols[0].length; c += 2) {
      //
      //     range = list + '!' + cols[0][c] + xArray[x] + ':' + cols[0][c + 1] + xArray[x];
      //     value = [[values[c], values[c + 1]]];
      //
      //     await crud.updateData(value, config.ssId.amo, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(1000);
      //   }
      //
      //   console.log('Project: ' + x);
      //
      // }
      // console.log(new Date());
      // console.log('* The receipt of money from customers (prepaid & finalLy) *');

      //--------------------------------------------------------------------------
      // Build ratioParams for "Ratio" and "factHours"
      //--------------------------------------------------------------------------
      //
      // let ratioParams = [[], [], []];
      //
      // //= l.a.w.t - The list accounting work time =
      // let lawt = {
      //   name: [],
      //   table: []
      // };
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   ratioParams[0].push([]);
      //   ratioParams[1].push([]);
      //   ratioParams[2].push([]);
      //
      //   for (let i = (xArray[x] - START); i < (xArray[x] - START) + CREW; i++) {
      //      if (registry[i][7]) {
      //        ratioParams[0][x].push(registry[i][7]);
      //
      //        // = Get object lawt name[0] -> table[0] etc. =
      //        if (!lawt.name.includes(registry[i][7])) {
      //          lawt.name.push(registry[i][7]);
      //          list = encodeURIComponent(registry[i][7]);
      //          range = list + '!B10:L1000';
      //          lawt.table.push(await crud.readData(config.ssId.lawt, range));
      //        }
      //     }
      //   }
      //
      //   for (var m = 0; m < cutActionMonths[x].length; m++) {
      //       ratioParams[1][x].push(cutActionMonths[x][m]);
      //   }
      //   ratioParams[2][x].push(registry[xArray[x] - START][0]);
      //   ratioParams[2][x].push(registry[xArray[x] - START][4]);
      //
      // }
      //
      // list = encodeURIComponent('ФОТ (факт)');
      // range = list + '!A6:ER77';
      //
      // let salary = await crud.readData(config.ssId.salary, range);
      //
      // //--------------------------------------------------------------------------
      // // Get & Insert "Ratio & factHours"
      // //--------------------------------------------------------------------------
      //
      // let [ratio, factHours, warrentyHours] = await getRatio(salary, lawt, ratioParams, cutContractMonths);
      //
      // //console.log(factHours);
      //
      // list = encodeURIComponent('AMO (реестр)');
      //
      // for (let x = 0; x < xArray.length; x++) {
      //   cols = [[], [], []];
      //
      //   for (let m = 0; m < cutActionMonths[x].length; m++) {
      //      cols[1] = cols[1].concat(colMonths[cutActionMonths[x][m]].slice(2, 4));
      //   }
      //
      //   for (let c = 0; c < cols[1].length; c += 2) {
      //
      //     range = list + '!' + cols[1][c] + xArray[x] + ':' + cols[1][c + 1] + (xArray[x] + (CREW - 1));
      //     let value = [];
      //     if (!c) {
      //       value = [];
      //       for (let i = 0; i < CREW; i++) {
      //         if (i < ratio[x][c].length){
      //           value.push([ratio[x][c][i], factHours[x][c][i]]);
      //         } else {
      //           value.push([0, 0]);
      //         }
      //
      //       }
      //     } else {
      //       value = [];
      //       for (let i = 0; i < CREW; i++) {
      //         if (i < ratio[x][c / 2].length) {
      //           value.push([ratio[x][c / 2][i], factHours[x][c / 2][i]]);
      //         } else {
      //           value.push([0, 0]);
      //         }
      //
      //       }
      //     }
      //
      //     await crud.updateData(value, config.ssId.amo, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //
      //   }
      //
      //   let value = [];
      //
      //   for (let m = 0; m < cutActionMonths[x].length; m++) {
      //      cols[2] = cols[2].concat(colMonths[cutActionMonths[x][m]].slice(4));
      //   }
      //
      //   for (let c = 0; c < cols[2].length; c++) {
      //     range = list + '!' + cols[2][c] + xArray[x] + ':' + cols[2][c] + (xArray[x] + (CREW - 1));
      //     value = [];
      //
      //     for (let i = 0; i < CREW; i++) {
      //       value.push([warrentyHours[x][c][i] ? warrentyHours[x][c][i] : 0]);
      //     }
      //
      //     await crud.updateData(value, config.ssId.amo, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //   }
      //
      //   console.log('Project: ' + x);
      //
      // }
      // console.log(new Date());
      // console.log('* ratioParams for Ratio and factHours *');

      //------------------------------------------------------------------------
      // Build params for Margin
      //------------------------------------------------------------------------

      //= Build ABC for margin params =
      abc = abc.slice(2, 120);
      let colsMargin = config.colsMargin;

      const quantity = 4;
      let jArray = [];

      for (let x = 0; x < xArray.length; x++) {
        let paramsMargin = [];

        for (let i = 0; i < 26; i++) {
          paramsMargin.push([]);
        }

        //= Push site in params =
        paramsMargin[0].push(registry[xArray[x] - START][0]);

        //= Push debt "P" in params =
        let col = abc.indexOf(colsMargin.debt);
        registry[xArray[x] - START][col] && Number(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
          ? paramsMargin[1].push(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
          : paramsMargin[1].push(0);

        //= Push salary of CREW (x7) in params =
        for (let i = xArray[x] - START; i < xArray[x] - START + CREW; i++) {
          let count = 0;
          for (let j = 2; j < (paramsMargin.length - 3); j += quantity) {
            let col = abc.indexOf(colsMargin.salary[count]);
            registry[i][col] && Number(registry[i][col].replace(/\s/g, '').replace(/,/g, '.'))
                ? paramsMargin[j].push(registry[i][col].replace(/\s/g, '').replace(/,/g, '.'))
                : paramsMargin[j].push(0);

            jArray.push(j);
            count++;
          }
        }

        //= Push other cost (common for project) in params =
        let count = 0;

        for (let n = 3; n < paramsMargin.length; n++) {
          if (!jArray.includes(n)) {
            let col = abc.indexOf(colsMargin.other[count]);
            registry[xArray[x] - START][col] && Number(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
              ? paramsMargin[n].push(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
              : paramsMargin[n].push(0);
            count++;
          }
        }

        //console.log(paramsMargin);

        //= Get & Insert values of "Margin & Margins" =
        let margin = await getMargin(contractSum, paramsMargin);
        let margins = 0;

        for (var c = 0; c < contractSum.length; c++) {
          if(contractSum[c][0] == paramsMargin[0]) {
            margins = margin ? margin / contractSum[c][1] : 0;
          }
        }

        //= Cut to 2 number after poin =
        margins = margins.toFixed(2);

        list = encodeURIComponent('AMO (реестр)');
        range = list + '!N' + xArray[x] + ':O' + xArray[x];

        await crud.updateData([[margin, margins]], config.ssId.amo, range)
          .then(async result => {console.log(result);})
          .catch(console.err);

        console.log([margin, margins]);

        }
        console.log(new Date());
        console.log('* Update for Margin *');

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      range = 'sheet1!B4';

      let now = new Date();
      now = [
        [formatDate(now)]
      ];

      await crud.updateData(now, config.ssId.monit, range)
        //.then(async (result) => {console.log(result);})
        .catch(console.err);

      console.log('End: ' + new Date());

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = amoReg;
