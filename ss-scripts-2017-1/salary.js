'use strict';

const config = require('config');

async function salary(month) {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const salaryQuery = require('../models/db_salary-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 6;
      const MON_COLS = config.salary_colMonths;
      const DIRECTIONS = config.directions.common

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let srcRows = {
        lera: '',
        olga: ''
      };

      //-------------------------------------------------------------
      // Read data from dds_lera to RAM
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Лера');
      range1 = list + '!A6:V';

      list = encodeURIComponent('ДДС_Ольга');
      range2 = list + '!A6:AD';

      await Promise.all([
        crud.readData(config.sid_2017.dds, range1),
        crud.readData(config.sid_2017.dds, range2)
      ])
       .then(async ([dds_lera, dds_olga]) => {
          srcRows.lera = dds_lera;
          srcRows.olga = dds_olga;
        })
        .catch(console.log);

      //---------------------------------------------------------------
      // Refresh table
      //---------------------------------------------------------------

      await Promise.all([
        dbRefresh(pool, 'dds_lera', srcRows.lera),
        dbRefresh(pool, 'dds_olga', srcRows.olga)
      ])
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Get data from 'Slalary'
      //------------------------------------------------------------------------

      list = encodeURIComponent('ФОТ (факт)');
      range = list + '!B1:E';
      let dataSalary = await crud.readData(config.sid_2017.salary, range);

      //------------------------------------------------------------------------
      // Build paramsSlary and get & update Salary
      //------------------------------------------------------------------------

      let paramsSalary = [[], [], [], []];
      let numMonth = MON_COLS[month][0];

      try {

        //= Build params =
        for (let a = (START - 1); a < dataSalary.length; a++) {
          if (dataSalary[a][0] && dataSalary[a][3]) {
            paramsSalary[0].push(dataSalary[a][0]);
            paramsSalary[1].push(dataSalary[a][3]);

          } else {
            paramsSalary[0].push(' ');
            paramsSalary[1].push(' ');
          }
        }

        paramsSalary[2].push(numMonth);
        paramsSalary[3] = DIRECTIONS;

        //= Get sum Salary =
        let sum1;
        let sum2;

        //= Get common sum Salary =
        await Promise.all([
          salaryQuery(pool, 'dds_lera', paramsSalary, true),
          salaryQuery(pool, 'dds_olga', paramsSalary, true)
        ])
          .then(async ([s1, s2]) => {
            sum1 = s1;
            sum2 = s2;
          })
          .catch(console.log);

        let sumCommon = [];

        for (let i = 0; i < sum1.length; i++) {
          sumCommon.push([Number(sum1[i][0]) + Number(sum2[i][0])]);
        }

        //= Get directions sum Salary =
        await Promise.all([
          salaryQuery(pool, 'dds_lera', paramsSalary, false),
          salaryQuery(pool, 'dds_olga', paramsSalary, false)
        ])
          .then(async ([s1, s2]) => {
            sum1 = s1;
            sum2 = s2;
          })
          .catch(console.log);

        let sumDirections = [];

        for (let i = 0; i < sum1.length; i++) {
          sumDirections.push([]);
          for (let j = 0; j < sum1[i].length; j++) {
            sumDirections[i].push([Number(sum1[i][j][0]) + Number(sum2[i][j][0])]);
          }
        }

        //= Update common sum Salary  =
        range = list + '!' + MON_COLS[month][1][0] + START + ':'
          + MON_COLS[month][1][0] + (sumCommon.length + START);

        await crud.updateData(sumCommon, config.sid_2017.salary, range)
          .then(async results => {console.log(results);})
          .catch(console.log);

        //= Update directions sum Salary =
        for (let d = 0; d < DIRECTIONS.length; d++) {

          range = list + '!' + MON_COLS[month][1][d + 1] + START + ':'
            + MON_COLS[month][1][d + 1] + (sumCommon.length + START);

          await crud.updateData(sumDirections[d], config.sid_2017.salary, range)
            .then(async results => {console.log(results);})
            .catch(console.log);
          await sleep(1000);
        }

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!C15';
      let now = new Date();
      now = [[formatDate(now)]];
      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

      } catch (e) {

      }


  });
}

module.exports = salary;
