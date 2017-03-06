'use strict';

const config = require('config');
const _ = require('lodash/array');

async function salaryDistrib() {
  return new Promise(async(resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const salaryQuery = require('../models/db_salary-query');

    //--------------------------------------------------------------------------
    // Main function
    //--------------------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = {
        'calc': encodeURIComponent('Расчет ЗП'),
        'fot': encodeURIComponent('ФОТ (факт)'),
        'distrib': [
          encodeURIComponent('Распределение 1'),
          //encodeURIComponent('Распределение 2'),
          // encodeURIComponent('Распределение 3'),
          // encodeURIComponent('Распределение 4'),
          // encodeURIComponent('Распределение 5'),
          // encodeURIComponent('Распределение 6')
        ]
      };

      let range;
      let dataCalcSalary;
      let paramsDistrib;
      let dataDistrib;
      let accruedSalary = [];
      let salaryDistrib = [];

      let salaryDirection = {
        'Мульти сайт': [],
        'Профи': [],
        'AMO CRM': []
      };

      try {

        range = list.calc + '!B11:K';
        dataCalcSalary = await crud.readData(config.sid_2017.salary, range);

        for (let d = 0; d < list.distrib.length; d++) {

          range = list.distrib[d] + '!B6:C';
          paramsDistrib = await crud.readData(config.sid_2017.salary, range);

          for (let n = 0; n < paramsDistrib.length; n++) {
            for (let i = 0; i < dataCalcSalary.length; i++) {
              if (paramsDistrib[n][0] == dataCalcSalary[i][8]
                && dataCalcSalary[i][0] == 'К выдаче') {

                  switch (d) {
                    case 0:
                      accruedSalary.push([dataCalcSalary[i][1]]);
                      break;
                    case 1:
                      accruedSalary.push([dataCalcSalary[i][2]]);
                      break;
                    case 2:
                      accruedSalary.push([dataCalcSalary[i][3]]);
                      break;
                    case 3:
                      accruedSalary.push([dataCalcSalary[i][4]]);
                      break;
                    case 4:
                      accruedSalary.push([dataCalcSalary[i][5]]);
                      break;
                    case 5:
                      accruedSalary.push([dataCalcSalary[i][6]]);
                      break;
                    default:
                      break;
                  }

              }
            }
          }

          range = list.distrib[d] + '!D6:D';

          await crud.updateData(accruedSalary, config.sid_2017.salary, range)
            .then(async (results) => {console.log(results);})
            .catch(console.log);

          //--------------------------------------------------------------------

          range = list.distrib[d] + '!B6:I';
          dataDistrib = await crud.readData(config.sid_2017.salary, range);

          range = list.distrib[d] + '!AE5:AN';
          let dataDistribDir = await crud.readData(config.sid_2017.salary, range);

          //console.log(dataDistribDir);
          for (let i = 0; i < dataDistribDir[0].length; i++) {
            dataDistribDir[0][i] = dataDistribDir[0][i].slice(2).trim();
          }

          for (let i = 1; i < dataDistribDir.length; i++) {
            for (let j = 0; j < dataDistribDir[i].length; j++) {
              if (dataDistribDir[i][j] && dataDistribDir[i][j].trim()[0] == '(' && dataDistribDir[i][j][dataDistribDir[i][j].length - 1] == ')') {
                dataDistribDir[i][j] = dataDistribDir[i][j].trim().slice(1).slice(0, -1);
                dataDistribDir[i][j] = '-' + dataDistribDir[i][j].replace(/\s/g, '');
                dataDistribDir[i][j] = Number(dataDistribDir[i][j]);
              } else if (dataDistribDir[i][j] && dataDistribDir[i][j].trim() != '-') {
                dataDistribDir[i][j] = Number(dataDistribDir[i][j].replace(/\s/g, ''))
              } else {
                dataDistribDir[i][j] = 0;
              }
            }
          }

          console.log(dataDistribDir);

          for (let j = 0; j < dataDistribDir[0].length; j++) {
            for (let key in salaryDirection) {
              for (let i = 1; i < dataDistribDir.length; i++) {
                salaryDirection[key].push([]);
                if (dataDistribDir[0][j] == key) {
                  salaryDirection[key][i].push(dataDistribDir[i][j]);
                }
              }
            }
          }

          console.log(salaryDirection);

          for (let i = 0; i < dataDistrib.length; i++) {
            salaryDistrib.push([]);
            if (dataDistrib[i][1] != 'ЛУВР') {
              for (let j = 3; j < 7; j++) {
                if (dataDistrib[i][j]) {
                  salaryDistrib[i].push(
                    Number(dataDistrib[i][2].replace(/\s/g, ''))
                    * Number(dataDistrib[0][j].replace(/%/g, '')) * 0.01
                  );
                } else {
                  salaryDistrib[i].push(0);
                }
              }
            } else {


            }
          }

          //console.log(salaryDistrib);

          await sleep(800);
        }

      } catch (e) {
        reject(e.stack);
      }


      // //------------------------------------------------------------------------
      // // Read data from dds_lera to RAM
      // //------------------------------------------------------------------------
      //
      // list = encodeURIComponent('ДДС_Лера');
      // range1 = list + '!A6:V';
      //
      // list = encodeURIComponent('ДДС_Ольга');
      // range2 = list + '!A6:AD';
      //
      // await Promise.all([
      //   crud.readData(config.sid_2017.dds, range1),
      //   crud.readData(config.sid_2017.dds, range2)
      // ])
      //  .then(async ([dds_lera, dds_olga]) => {
      //     srcRows.lera = dds_lera;
      //     srcRows.olga = dds_olga;
      //   })
      //   .catch(console.log);
      //
      // //------------------------------------------------------------------------
      // // Refresh table
      // //------------------------------------------------------------------------
      //
      // await Promise.all([
      //   dbRefresh(pool, 'dds_lera', srcRows.lera),
      //   dbRefresh(pool, 'dds_olga', srcRows.olga)
      // ])
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.log);
      //
      // //------------------------------------------------------------------------
      // // Get data from 'Slalary'
      // //------------------------------------------------------------------------
      //
      // list = encodeURIComponent('ФОТ (факт)');
      // range = list + '!B1:E';
      // let dataSalary = await crud.readData(config.sid_2017.salary, range);
      //
      // //------------------------------------------------------------------------
      // // Build paramsSlary and get & update Salary
      // //------------------------------------------------------------------------
      //
      // try {
      //
      //   let numMonth = [];
      //   let paramsSalary = [[], [], [], []];
      //
      //   //= Build params =
      //   for (let a = (START - 1); a < dataSalary.length; a++) {
      //     if (dataSalary[a][0] && dataSalary[a][3]) {
      //       paramsSalary[0].push(dataSalary[a][0]); //name
      //       paramsSalary[1].push(dataSalary[a][3]); //departion
      //     } else {
      //       paramsSalary[0].push(' ');
      //       paramsSalary[1].push(' ');
      //     }
      //   }
      //
      //   months.forEach(month => {
      //     numMonth.push(MON_COLS[month][0]);
      //   });
      //
      //   paramsSalary[2] = numMonth; //months
      //   paramsSalary[3] = DIRECTIONS; //directions
      //
      //   //= Get sum Salary =
      //   let sum1;
      //   let sum2;
      //
      //   //----------------------------------------------------------------------
      //   // Get common sum Salary
      //   //----------------------------------------------------------------------
      //
      //   await Promise.all([
      //     salaryQuery(pool, 'dds_lera', paramsSalary, true),
      //     salaryQuery(pool, 'dds_olga', paramsSalary, true)
      //   ])
      //     .then(async ([s1, s2]) => {
      //       sum1 = s1;
      //       sum2 = s2;
      //     })
      //     .catch(console.log);
      //
      //   let sumCommon = [];
      //
      //   for (let m = 0; m < sum1.length; m++) {
      //     sumCommon.push([]);
      //     for (let i = 0; i < sum1[m].length; i++) {
      //       sumCommon[m].push([Number(sum1[m][i]) + Number(sum2[m][i])]);
      //     }
      //   }
      //
      //   //console.log(sumCommon);
      //
      //   //----------------------------------------------------------------------
      //   // Get directions sum Salary
      //   //----------------------------------------------------------------------
      //
      //   await Promise.all([
      //     salaryQuery(pool, 'dds_lera', paramsSalary, false),
      //     salaryQuery(pool, 'dds_olga', paramsSalary, false)
      //   ])
      //     .then(async ([s1, s2]) => {
      //       sum1 = s1;
      //       sum2 = s2;
      //     })
      //     .catch(console.log);
      //
      //   let sumDirections = [];
      //
      //   for (let m = 0; m < sum1.length; m++) {
      //     sumDirections.push([]);
      //     for (let i = 0; i < sum1[m].length; i++) {
      //       sumDirections[m].push([]);
      //       for (let j = 0; j < sum1[m][i].length; j++) {
      //         sumDirections[m][i].push(
      //           Number(sum1[m][i][j]) + Number(sum2[m][i][j])
      //         );
      //       }
      //     }
      //   }
      //
      //   //----------------------------------------------------------------------
      //   // To zip result for Directions in stack, prepair array of function
      //   // and update (Direction & Common)
      //   //----------------------------------------------------------------------
      //
      //   let zipValues = [];
      //   let arrRange_C = [];
      //   let arrFuncions_C = [];
      //   let arrRange_D = [];
      //   let arrFuncions_D = [];
      //
      //   //= Zip valuses =
      //   sumDirections.forEach(val => {
      //     let arrDirections = [];
      //     for (let a = 0; a < val.length; a++) {
      //       arrDirections.push(val[a]);
      //     }
      //     // !! Hardcode 5 params, in future possible more than that
      //     zipValues.push(_.zip(
      //       arrDirections[0],
      //       arrDirections[1],
      //       arrDirections[2],
      //       arrDirections[3],
      //       arrDirections[4]
      //     ));
      //   });
      //
      //   //= Prepare array of Range & Functions for Common =
      //   months.forEach(month => {
      //     arrRange_C.push(list + '!' + MON_COLS[month][1][0] + START + ':' + MON_COLS[month][1][0]);
      //   });
      //
      //   sumCommon.forEach((arrValues, i)=> {
      //     arrFuncions_C.push(crud.updateData(arrValues, config.sid_2017.salary, arrRange_C[i]));
      //   });
      //
      //   //= Prepare array of Range & Functions for Direcions =
      //   months.forEach(month => {
      //     arrRange_D.push(list + '!' + MON_COLS[month][1][1] + START + ':' + MON_COLS[month][1][5]);
      //   });
      //
      //   zipValues.forEach((arrValues, i)=> {
      //     arrFuncions_D.push(crud.updateData(arrValues, config.sid_2017.salary, arrRange_D[i]));
      //   });
      //
      //   //= Update data for Common =
      //   await Promise.all(arrFuncions_C)
      //   //  .then(async (results) => {console.log(results);})
      //     .catch(console.log);
      //
      //   //= Update data for Directions =
      //   await Promise.all(arrFuncions_D)
      //   //  .then(async (results) => {console.log(results);})
      //     .catch(console.log);
      //
      // } catch (e) {
      //   reject(e.stack);
      // }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // if (mode) {
      //   range = 'main!B15';
      // } else {
      //   range = 'main!C15';
      // }
      // let now = new Date();
      // now = [[formatDate(now)]];
      // await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = salaryDistrib;
