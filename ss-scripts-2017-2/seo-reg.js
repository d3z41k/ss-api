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
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const seoQuery = require('../models/db_seo-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      const START = 4;
      const MONTHS = ['1', '2', '3', '4', '5' ,'6'];
      const ROLES = ['SEO оптимизатор', 'Копирайтер', 'Проект-менеджер', 'Верстальщик'];

      let valueLawtAll = [];
      let range = '';
      let list = {

        'manual': encodeURIComponent('Спр'),
        'margin': encodeURIComponent('Маржинальность'),
        'hoursWorked': encodeURIComponent('Отработанные часы'),
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

      //---------------------------------------------------------------------
      // Get LAWT Employees
      //---------------------------------------------------------------------

      range = list.manual + '!O2:O';
      let stuff = await crud.readData(config.sid_2017.lawt, range);

      let crew = stuff;

      crew.forEach(name => {
        name.push(0);
      });

      stuff = stuff.map(employee => {
        return employee[0];
      });

      let salary = {
        '1': [],
        '2': [],
        '3': [],
        '4': [],
        '5': [],
        '6': []
      };

      //---------------------------------------------------------------------
      // Get SEO Рroject
      //---------------------------------------------------------------------

      range = list.margin + '!A4:A';
      let seoProjects = await crud.readData(config.sid_2017.seo_margin, range);

      seoProjects = seoProjects.map(project => {
        return project[0];
      });

      //console.log(seoProjects);

      let seoSalary = {
        '1': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '2': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '3': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '4': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '5': {
          'SEO оптимизатор': [],
          'Копирайтер': [],
          'Проект-менеджер': [],
          'Верстальщик': [],
        },
        '6': {
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

        let month = list.distrib[i].substr(-1);

        range = list.distrib[i] + '!B6:D';
        let slaryData = await crud.readData(config.sid_2017.salary, range);

        for (let c = 0; c < crew.length; c++) {
          for (let s = 0; s < slaryData.length; s++) {
            if(crew[c][0] == slaryData[s][0] && slaryData[s][2]) {
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
          let dataLawtRaw = await crud.readData(config.sid_2017.lawt, range);

          let dataLawt = dataLawtRaw.map((row) => {
            return [row[1], row[2], row[7], row[27]];
          });

          let role = dataLawt[0][0];

          if(ROLES.includes(role)) {

            //Get Worked hours

            let workHours = {
              '1': 0,
              '2': 0,
              '3': 0,
              '4': 0,
              '5': 0,
              '6': 0
            };

            dataLawt.forEach((line, l) => {
              if (line[1] && line[3] && MONTHS.includes(line[3]) && l > 6) {
                workHours[line[3]] += formatNumber(line[1]);
              }
            });

            //= Get ratio =
            for (let m = 0; m < MONTHS.length; m++) {
              if(salary[MONTHS[m]][stuff[e]] && workHours[MONTHS[m]]) {
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

                    if(seoSalary[dataLawt[l][3]][role].hasOwnProperty(seoProjects[p])) {
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

      //---------------------------------------------------------------------
      // Prepair data
      //---------------------------------------------------------------------

      //console.log(seoSalary);

      let col_seoMargin = {
        '1': ['E', 'H'],
        '2': ['K', 'N'],
        '3': ['Q', 'T'],
        '4': ['W', 'Z'],
        '5': ['AC', 'AF'],
        '6': ['AI', 'AL'],
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

        await crud.updateData(dataArray[m], config.sid_2017.seo_margin, range)
          .then(async result => {console.log(result);})
          .catch(console.err);

      }

      //console.log(dataArray);

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!D6';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = seoReg;
