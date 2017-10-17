'use strict';

const config = require('config');

async function seoReg() {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const formatNumber = require('../libs/format-number');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      const START = 5;
      const RATE = {
        'copywrite': 50,
        'copywriteClient': 500,
        'SEO оптимизатор': 1000,
        'Проект-менеджер': 1000,
        'Верстальщик': 1000
      };
      const MONTHS = ['7', '8', '9', '10', '11', '12'];
      const ROLES = ['SEO оптимизатор', 'Проект-менеджер', 'Верстальщик'];
      const DIVISION = ['company', 'client'];

      let range = '';
      let list = {
        'manual': encodeURIComponent('Спр'),
        'margin': encodeURIComponent('Маржинальность'),
        'marginClient': encodeURIComponent('Маржинальность (для клиента)'),
        'hoursWorked': encodeURIComponent('Отработанные часы'),
        'distrib': [
          encodeURIComponent('Распределение 7'),
          encodeURIComponent('Распределение 8'),
          encodeURIComponent('Распределение 9'),
          encodeURIComponent('Распределение 10'),
          encodeURIComponent('Распределение 11'),
          encodeURIComponent('Распределение 12')
        ],
        'copywrite': [
          encodeURIComponent('Галина работа июль'),
          encodeURIComponent('Галина работа август'),
          encodeURIComponent('Галина работа сентябрь')
        ],

        'listName': function(name) {
          return encodeURIComponent(name);
        }

      };

      //---------------------------------------------------------------------
      // Get LAWT Employees
      //---------------------------------------------------------------------

      range = list.manual + '!O2:O';
      let stuff = await crud.readData(config.sid_2017_2.lawt, range);

      let crew = stuff;

      crew.forEach(name => {
        name.push(0);
      });

      stuff = stuff.map(employee => {
        return employee[0];
      });

      let salary = {
        '7': [],
        '8': [],
        '9': [],
        '10': [],
        '11': [],
        '12': []
      };

      //---------------------------------------------------------------------
      // Get SEO Рroject
      //---------------------------------------------------------------------

      range = list.margin + '!A4:A';
      let seoProjects = await crud.readData(config.sid_2017_2.seo_margin, range);

      seoProjects = seoProjects.map(project => {
        return project[0];
      });

      for (let d = 0; d < DIVISION.length; d++) {

        let seoSalary = {
          '7': {
            'SEO оптимизатор': [],
            'Проект-менеджер': [],
            'Копирайтер': [],
            'Верстальщик': [],
          },
          '8': {
            'SEO оптимизатор': [],
            'Проект-менеджер': [],
            'Копирайтер': [],
            'Верстальщик': [],
          },
          '9': {
            'SEO оптимизатор': [],
            'Проект-менеджер': [],
            'Копирайтер': [],
            'Верстальщик': [],
          },
          '10': {
            'SEO оптимизатор': [],
            'Проект-менеджер': [],
            'Копирайтер': [],
            'Верстальщик': [],
          },
          '11': {
            'SEO оптимизатор': [],
            'Проект-менеджер': [],
            'Копирайтер': [],
            'Верстальщик': [],
          },
          '12': {
            'SEO оптимизатор': [],
            'Проект-менеджер': [],
            'Копирайтер': [],
            'Верстальщик': [],
          },

        };

        if (DIVISION[d] === 'company') {

          //---------------------------------------------------------------------
          // Get Salary
          //---------------------------------------------------------------------

          for (let i = 0; i < list.distrib.length; i++) {

            let month = decodeURIComponent(list.distrib[i]).match(/\d+/)[0];

            range = list.distrib[i] + '!B6:D';
            let slaryData = await crud.readData(config.sid_2017_2.salary, range);

            for (let c = 0; c < crew.length; c++) {
              for (let s = 0; s < slaryData.length; s++) {
                if (crew[c][0] == slaryData[s][0] && slaryData[s][2]) {
                  salary[month][crew[c][0]] = formatNumber(slaryData[s][2]);
                }
              }
            }

          }
        } //endif

        if (DIVISION[d] === 'company') {

          //---------------------------------------------------------------------
          // Ger ratio and seoSalary
          //---------------------------------------------------------------------

          for (let e = 0; e < stuff.length; e++) {

            try {
              range = list.listName(stuff[e]) + '!A3:AB';
              let dataLawtRaw = await crud.readData(config.sid_2017_2.lawt, range);

              let dataLawt = dataLawtRaw.map((row) => {
                return [row[1], row[2], row[7], row[27]];
              });

              let role = dataLawt[0][0];

              if (ROLES.includes(role)) {

                //Get Worked hours

                let workHours = {
                  '7': 0,
                  '8': 0,
                  '9': 0,
                  '10': 0,
                  '11': 0,
                  '12': 0
                };

                dataLawt.forEach((line, l) => {
                  if (line[1] && line[3] && MONTHS.includes(line[3]) && l > 6) {
                    workHours[line[3]] += formatNumber(line[1]);
                  }
                });

                //= Get ratio =
                for (let m = 0; m < MONTHS.length; m++) {
                  if (salary[MONTHS[m]][stuff[e]] && workHours[MONTHS[m]]) {
                    salary[MONTHS[m]][stuff[e]] = salary[MONTHS[m]][stuff[e]] / workHours[MONTHS[m]];
                  }
                }

                for (let l = 0; l < dataLawt.length; l++) {
                  for (let p = 0; p < seoProjects.length; p++) {
                    if (dataLawt[l][1]
                      && dataLawt[l][2]
                      && dataLawt[l][0] === 'SEO '
                      && MONTHS.includes(dataLawt[l][3])
                      && dataLawt[l][2] == seoProjects[p]) {

                      if (seoSalary[dataLawt[l][3]][role].hasOwnProperty(seoProjects[p])) {
                        seoSalary[dataLawt[l][3]][role][seoProjects[p]] += (formatNumber(dataLawt[l][1]) * salary[dataLawt[l][3]][stuff[e]]);
                      } else {
                        seoSalary[dataLawt[l][3]][role][seoProjects[p]] = (formatNumber(dataLawt[l][1]) * salary[dataLawt[l][3]][stuff[e]]);
                      }
                    }
                  }
                }

              }

            } catch (e) {
              reject(e.stack);
            }

          } //end staff

        } //endif

        if (DIVISION[d] === 'client') {

          //---------------------------------------------------------------------
          // Ger ratio and seoSalary
          //---------------------------------------------------------------------

          for (let e = 0; e < stuff.length; e++) {

            try {
              range = list.listName(stuff[e]) + '!A3:AB';
              let dataLawtRaw = await crud.readData(config.sid_2017_2.lawt, range);

              let dataLawt = dataLawtRaw.map((row) => {
                return [row[1], row[2], row[7], row[27]];
              });

              let role = dataLawt[0][0];

              if (ROLES.includes(role)) {

                //Get Worked hours

                let workHours = {
                  '7': 0,
                  '8': 0,
                  '9': 0,
                  '10': 0,
                  '11': 0,
                  '12': 0
                };

                dataLawt.forEach((line, l) => {
                  if (line[1] && line[3] && MONTHS.includes(line[3]) && l > 6) {
                    workHours[line[3]] += formatNumber(line[1]);
                  }
                });

                for (let l = 0; l < dataLawt.length; l++) {
                  for (let p = 0; p < seoProjects.length; p++) {
                    if (dataLawt[l][1]
                      && dataLawt[l][2]
                      && dataLawt[l][0] === 'SEO '
                      && MONTHS.includes(dataLawt[l][3])
                      && dataLawt[l][2] == seoProjects[p]) {

                      if (seoSalary[dataLawt[l][3]][role].hasOwnProperty(seoProjects[p])) {
                        seoSalary[dataLawt[l][3]][role][seoProjects[p]] += (formatNumber(dataLawt[l][1]) * RATE[role]);
                      } else {
                        seoSalary[dataLawt[l][3]][role][seoProjects[p]] = (formatNumber(dataLawt[l][1]) * RATE[role]);
                      }
                    }
                  }
                }

              }

            } catch (e) {
              reject(e.stack);
            }

          } //end staff

        } //endif

        let dataCopywrite = [];

        for (var c = 0; c < list.copywrite.length; c++) {
          range = list.copywrite[c] + '!A3:S';
          let dataCopywriteRaw = await crud.readData(config.sid_2017_2.copywrite, range);

          dataCopywriteRaw.forEach((row) => {
            dataCopywrite.push([row[0], row[7], row[15], row[18]]);
          });
        }

        if (DIVISION[d] === 'company') {
          dataCopywrite.forEach(row => {
            if (row[1]
              && row[1] !== 'нет'
              && row[1].length <= 10
              && row[1].indexOf('/') === -1
            ) {

              let month = row[1].split('.')[1];

              month[0] === '0' ? month = month[1] : month;


              for (let p = 0; p < seoProjects.length; p++) {
                if (MONTHS.includes(month)
                  && row[2]
                  && row[0] == seoProjects[p]) {
                    if (seoSalary[month]['Копирайтер'].hasOwnProperty(seoProjects[p])) {
                      seoSalary[month]['Копирайтер'][seoProjects[p]] += row[3] ? formatNumber(row[2]) * formatNumber(row[3]) : formatNumber(row[2]) * RATE.copywrite;
                    } else {
                      seoSalary[month]['Копирайтер'][seoProjects[p]] = row[3] ? formatNumber(row[2]) * formatNumber(row[3]) : formatNumber(row[2]) * RATE.copywrite;
                    }
                  }
                }
              }
          });
        } //endif

        if (DIVISION[d] === 'client') {
          dataCopywrite.forEach(row => {
            if (row[1]
              && row[1] !== 'нет'
              && row[1].length <= 10
              && row[1].indexOf('/') === -1
            ) {
              let month = row[1].split('.')[1];
              month[0] === '0' ? month = month[1] : month;
              for (let p = 0; p < seoProjects.length; p++) {
                if (MONTHS.includes(month)
                  && row[2]
                  && row[0] == seoProjects[p]) {
                    if (seoSalary[month]['Копирайтер'].hasOwnProperty(seoProjects[p])) {
                      seoSalary[month]['Копирайтер'][seoProjects[p]] += row[3] ? formatNumber(row[2]) * formatNumber(row[3]) : formatNumber(row[2]) * RATE.copywriteClient;
                    } else {
                      seoSalary[month]['Копирайтер'][seoProjects[p]] = row[3] ? formatNumber(row[2]) * formatNumber(row[3]) : formatNumber(row[2]) * RATE.copywriteClient;
                    }
                  }
                }
              }
          });
        } //endif

        //---------------------------------------------------------------------
        // Prepair data
        //---------------------------------------------------------------------

        //console.log(seoSalary);

        let col_seoMargin = {
          '7': ['E', 'H'],
          '8': ['K', 'N'],
          '9': ['Q', 'T'],
          '10': ['W', 'Z'],
          '11': ['AC', 'AF'],
          '12': ['AI', 'AL'],
        };

        let dataArray = [];

        if (DIVISION[d] === 'company') {
          for (let m = 0; m < MONTHS.length; m++) {
            dataArray.push([]);

            for (let p = 0; p < seoProjects.length; p++) {
              let line = [];

              for (let role in seoSalary[MONTHS[m]]) {

                if (seoSalary[MONTHS[m]][role].hasOwnProperty(seoProjects[p])) {
                  line.push(seoSalary[MONTHS[m]][role][seoProjects[p]])
                } else {
                  line.push(0);
                }
              }
              dataArray[m].push(line);
            }

            range = list.margin + '!'+ col_seoMargin[MONTHS[m]][0] + START + ':' + col_seoMargin[MONTHS[m]][1];

            await crud.updateData(dataArray[m], config.sid_2017_2.seo_margin, range)
              //.then(async result => {console.log(result);})
              .catch(console.err);
          } //end months
        } //endif

        if (DIVISION[d] === 'client') {
          for (let m = 0; m < MONTHS.length; m++) {
            dataArray.push([]);

            for (let p = 0; p < seoProjects.length; p++) {
              let line = [];

              for (let role in seoSalary[MONTHS[m]]) {

                if (seoSalary[MONTHS[m]][role].hasOwnProperty(seoProjects[p])) {
                  line.push(seoSalary[MONTHS[m]][role][seoProjects[p]]);
                } else {
                  line.push(0);
                }
              }
              dataArray[m].push(line);
            }

            range = list.marginClient + '!'+ col_seoMargin[MONTHS[m]][0] + START + ':' + col_seoMargin[MONTHS[m]][1];

            await crud.updateData(dataArray[m], config.sid_2017_2.seo_margin, range)
              //.then(async result => {console.log(result);})
              .catch(console.err);
          } //end months
        } //endif

      } // end division

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B33';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017_2.monit, range);

      resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = seoReg;
