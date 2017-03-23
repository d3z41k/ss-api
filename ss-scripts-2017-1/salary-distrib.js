'use strict';

const config = require('config');

async function salaryDistrib() {
  return new Promise(async (resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');

    //--------------------------------------------------------------------------
    // Main function
    //--------------------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      const FOT_COLS = config.salary_distrib_colMonths;
      const START = 6;

      let range = '';
      let list = {
        'calc': encodeURIComponent('Расчет ЗП'),
        'fot': encodeURIComponent('ФОТ (факт)'),
        'distrib': [
          encodeURIComponent('Распределение 1'),
          encodeURIComponent('Распределение 2'),
          encodeURIComponent('Распределение 3'),
          encodeURIComponent('Распределение 4'),
          encodeURIComponent('Распределение 5'),
          encodeURIComponent('Распределение 6')
        ]
      };

      try {

        for (let d = 0; d < list.distrib.length; d++) { //Start distribution

          let range1;
          let range2;
          let paramsDistrib;
          let dataDistrib;
          let accruedSalary = [];
          let accruedSalaryNum = [];

          let salaryDirection = {
            'Мульти сайт': [],
            'Профи': [],
            'AMO CRM': []
          };

          range = list.calc + '!B11:K';
          let dataCalcSalary = await crud.readData(config.sid_2017.salary, range);

          range = list.distrib[d] + '!B' + START + ':C';
          paramsDistrib = await crud.readData(config.sid_2017.salary, range);

          for (let n = 0; n < paramsDistrib.length; n++) {
            for (let i = 0; i < dataCalcSalary.length; i++) {
              if (paramsDistrib[n][0]
                && paramsDistrib[n][0] == dataCalcSalary[i][8]
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

          range1 = list.distrib[d] + '!D' + START + ':D';
          range2 = list.fot + '!' + FOT_COLS[d + 1][0] + START + ':' + FOT_COLS[d + 1][0];

          accruedSalary.forEach(val => {
            if (val[0].replace(/\s/g, '') == '-') {
              accruedSalaryNum.push([0]);
            } else {
              accruedSalaryNum.push([val[0].replace(/\s/g, '')]);
            }
          });

          await Promise.all([
            crud.updateData(accruedSalaryNum, config.sid_2017.salary, range1),
            crud.updateData(accruedSalaryNum, config.sid_2017.salary, range2)
          ])
            .then(async (results) => {console.log(results);})
            .catch(console.log);

          //--------------------------------------------------------------------

          range = list.distrib[d] + '!B' + START + ':I';
          dataDistrib = await crud.readData(config.sid_2017.salary, range);

          range = list.distrib[d] + '!AE5:AN';
          let dataDistribDir = await crud.readData(config.sid_2017.salary, range);


          //= If existant danta =

          if (dataDistribDir.length > 2) {

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

            for (let i = 1; i < dataDistribDir.length; i++) {
              for (let key in salaryDirection) {
                salaryDirection[key].push([0]);
              }
            }

            for (let key in salaryDirection) {
              for (let i = 1; i < dataDistribDir.length; i++) {
                for (let d = 0; d < dataDistribDir[0].length; d++) {
                  if (dataDistribDir[0][d] == key) {
                    dataDistribDir[i][d]
                      ? salaryDirection[key][i - 1][0] += Number(dataDistribDir[i][d])
                      : salaryDirection[key][i - 1][0] += 0
                  }
                }
              }
            }

            let salaryDistrib = [];

            for (let i = 0; i < dataDistrib.length; i++) {
              salaryDistrib.push([]);
              if (dataDistrib[i][1] != 'ЛУВР') {
                for (let j = 3; j < 8; j++) {
                  if (dataDistrib[i][j] && dataDistrib[i][2]) {
                    salaryDistrib[i].push(
                      Number(dataDistrib[i][2].replace(/\s/g, ''))
                      * Number(dataDistrib[i][j].replace(/%/g, '')) * 0.01
                    );
                  } else {
                    salaryDistrib[i].push(0);
                  }
                }
              } else {
                for (var key in salaryDirection) {
                  salaryDistrib[i].push(salaryDirection[key][i][0]);
                }
                salaryDistrib[i].push(0);
                salaryDistrib[i].push(0);
              }
            }

            range1 = list.distrib[d] + '!K' + START + ':O';
            range2 = list.fot + '!' + FOT_COLS[d + 1][1] + START + ':' + FOT_COLS[d + 1][5];

            //console.log(salaryDistrib);

            await Promise.all([
              crud.updateData(salaryDistrib, config.sid_2017.salary, range1),
              crud.updateData(salaryDistrib, config.sid_2017.salary, range2)
            ])
              .then(async (results) => {console.log(results);})
              .catch(console.log);
          }

          await sleep(1000);
          resolve('complite!');
        } // End distribution

        //----------------------------------------------------------------------

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!E15';

      let now = new Date();
      now = [[formatDate(now)]];
      await crud.updateData(now, config.sid_2017.monit, range);

    //  resolve('complite!');

    } // = End start function =

  });
}

module.exports = salaryDistrib;
