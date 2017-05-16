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
        ],
        'listName': function(name) {
          return encodeURIComponent(name);
        }
      };

      //--------------------------------------------------------------------
      //
      //--------------------------------------------------------------------

      try {

        for (let d = 0; d < list.distrib.length; d++) { //Start distribution

          //--------------------------------------------------------------------
          // Accrued salary
          //--------------------------------------------------------------------

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

          //console.log(accruedSalary);

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
            //.then(async (results) => {console.log(results);})
            .catch(console.log);

          //--------------------------------------------------------------------
          // Distribution of hours (admin and project)
          //--------------------------------------------------------------------

          let adminTime = {
            'hours': []
          };

          let projectTime = {
            'hours': []
          };

          let paramsHours = [[], [], [], []];
          let employee = [];
          let valuesCommonTime = [];
          let valuesCommonTimeFinal = [];

          range = list.distrib[d] + '!B1:I';
          dataDistrib = await crud.readData(config.sid_2017.salary, range);

          paramsHours[0] = dataDistrib[0][6]; //current month
          paramsHours[1] = ['Административные задачи', 'Гарант. обслуж (сайт сдан)']; //admin type
          paramsHours[2] = ['МТС', 'Профи', 'AMO']; //directions
          paramsHours[3] = [
            'Разработка сайта ',
            'Доп.работы по разработке (МТС)',
            'SEO ',
            'Обслуживание (МТС)',
            'Контекстная реклама',
            'Аренда сайта (Профи)',
            'AMO', //en
            'АМО'  //ru
          ]; //activities

          for (let i = START; i < dataDistrib.length; i++) {
            if (dataDistrib[i][1] == 'ЛУВР') {
              employee.push(dataDistrib[i][0]); //lawt employee
            }
          }

          for (var e = 0; e < employee.length; e++) {

            adminTime.hours = [0, 0, 0, 0, 0]; //reset by new emploee
            projectTime.hours = [0, 0, 0, 0, 0, 0, 0, 0]; //reset by new emploee

            range = list.listName(employee[e]) + '!A10:E';
            let dataLawt = await crud.readData(config.sid_2017.lawt, range);

            for (let i = 0; i < dataLawt.length; i++) {
              if (Number(dataLawt[i][0].substr(3, 2)) == paramsHours[0]) {

                //= common adminTime =
                if ((dataLawt[i][2]
                  && dataLawt[i][1] == paramsHours[1][0])
                  || (dataLawt[i][2]
                  && dataLawt[i][1] == paramsHours[1][1])) {
                  adminTime.hours[0] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                }

                //= common projectTime =
               if (dataLawt[i][2]
                 && dataLawt[i][1] != paramsHours[1][0]
                 && dataLawt[i][1] != paramsHours[1][1]) {
                 projectTime.hours[0] += Number(dataLawt[i][2].replace(/\,/g, '.'));
               }

                //= direction adminTime =
                if (dataLawt[i][1] == paramsHours[1][0] && dataLawt[i][2]) {
                  switch(dataLawt[i][4]) {
                    case paramsHours[2][0]:
                      adminTime.hours[1] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[2][1]:
                      adminTime.hours[2] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[2][2]:
                      adminTime.hours[3] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    default:
                      break;
                  }
                } else if (dataLawt[i][1] == paramsHours[1][1] && dataLawt[i][2]) {
                    adminTime.hours[4] += Number(dataLawt[i][2].replace(/\,/g, '.'))
                }

                //= direction projectTime =

                if (dataLawt[i][2]) {
                  switch(dataLawt[i][1]) {
                    case paramsHours[3][0]:
                        projectTime.hours[1] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[3][1]:
                      projectTime.hours[2] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[3][2]:
                      projectTime.hours[3] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[3][3]:
                      projectTime.hours[4] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[3][4]:
                      projectTime.hours[5] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    case paramsHours[3][5]:
                      projectTime.hours[6] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                      break;
                    default:
                      break;
                  }
                }

                if (dataLawt[i][1].indexOf(paramsHours[3][6]) !== -1 && dataLawt[i][2]) {
                  projectTime.hours[7] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                } else if (dataLawt[i][1].indexOf(paramsHours[3][7]) !== -1 && dataLawt[i][2]) {
                  projectTime.hours[7] += Number(dataLawt[i][2].replace(/\,/g, '.'));
                }

              } //end if current month
            } //end months

            valuesCommonTime.push(adminTime.hours.concat([''], projectTime.hours));

          } //end employee


          //= Add epty lines =
          for (let i = (START - 1); i < dataDistrib.length; i++) {
            if (dataDistrib[i][1] == 'ЛУВР') {
              valuesCommonTimeFinal.push(valuesCommonTime.shift());
            } else {
              valuesCommonTimeFinal.push([0, 0, 0, 0, 0, '', 0, 0, 0, 0, 0, 0, 0, 0]);
            }
          }

          range = list.distrib[d] + '!Q' + START + ':AD';
          await crud.updateData(valuesCommonTimeFinal, config.sid_2017.salary, range)
            .then(async (results) => {console.log(results);})
            .catch(console.log);


          //--------------------------------------------------------------------
          // Distribution of salary
          //--------------------------------------------------------------------

          range = list.distrib[d] + '!B' + START + ':I';
          dataDistrib = await crud.readData(config.sid_2017.salary, range);

          range = list.distrib[d] + '!AF5:AP';
          let dataDistribDir = await crud.readData(config.sid_2017.salary, range);

          //= If existant data =

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

            //console.log(salaryDirection);

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
              }
              else {

                  for (var key in salaryDirection) {
                    if (salaryDirection[key][i]) {
                      salaryDistrib[i].push(salaryDirection[key][i][0]);
                    }
                  }
                }

            }

            //console.log(salaryDistrib);

            let zeroArray = [];

            for (let i = 0; i < 70; i++) {
              zeroArray.push([]);
              for (let j = 0; j < 5; j++) {
                zeroArray[i].push(0);
              }
            }

            range1 = list.distrib[d] + '!K' + START + ':O';
            range2 = list.fot + '!' + FOT_COLS[d + 1][1] + START + ':' + FOT_COLS[d + 1][5];

            // Clear old data
            await crud.updateData(zeroArray, config.sid_2017.salary, range1)
              //.then(async (results) => {console.log(results);})
              .catch(console.log);

            await Promise.all([
              crud.updateData(salaryDistrib, config.sid_2017.salary, range1),
              crud.updateData(salaryDistrib, config.sid_2017.salary, range2)
            ])
              //.then(async (results) => {console.log(results);})
              .catch(console.log);
          }

          //resolve('complite!');
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

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = salaryDistrib;
