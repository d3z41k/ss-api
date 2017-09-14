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

      const START = 4;
      const COPYWRITE_RATIO = 500;
      const MONTHS = ['7', '8', '9', '10', '11', '12'];
      const ROLES = ['SEO оптимизатор', 'Проект-менеджер', 'Верстальщик'];

      let range = '';
      let list = {
        'manual': encodeURIComponent('Спр'),
        'margin': encodeURIComponent('Маржинальность'),
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

      let seoSalary = {
        '7': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '8': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '9': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '10': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '11': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '12': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },

      };

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

      range = list.copywrite[0] + '!A3:S';
      let dataCopywriteRaw = await crud.readData(config.sid_2017_2.copywrite, range);

      let dataCopywrite = dataCopywriteRaw.map((row) => {
        return [row[0], row[7], row[15], row[18]];
      });

      dataCopywrite.forEach(row => {
        if (row[1] && row[1] !== 'нет') {
          let month = row[1].split('.')[1];
          month[0] === '0' ? month = month[1] : month;
          for (let p = 0; p < seoProjects.length; p++) {
            if (MONTHS.includes(month)
              && row[2]
              && row[0] == seoProjects[p]) {
                if (seoSalary[month]['Копирайтер'].hasOwnProperty(seoProjects[p])) {
                  seoSalary[month]['Копирайтер'][seoProjects[p]] += row[3] ? formatNumber(row[2]) * formatNumber(row[3]) : formatNumber(row[2]) * COPYWRITE_RATIO;
                } else {
                  seoSalary[month]['Копирайтер'][seoProjects[p]] = row[3] ? formatNumber(row[2]) * formatNumber(row[3]) : formatNumber(row[2]) * COPYWRITE_RATIO;
                }
              }
            }
          }
      });


      //---------------------------------------------------------------------
      // Prepair data
      //---------------------------------------------------------------------

      let col_seoMargin = {
        '7': ['E', 'H'],
        '8': ['K', 'N'],
        '9': ['Q', 'T'],
        '10': ['W', 'Z'],
        '11': ['AC', 'AF'],
        '12': ['AI', 'AL'],
      };

      let dataArray = [];

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
          .then(async result => {console.log(result);})
          .catch(console.err);

     } //end months

      //console.log(dataArray);

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!D6';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017_2.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = seoReg;
