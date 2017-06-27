'use strict';

const config = require('config');
const _ = require('lodash/array');

async function salary(months) {
  return new Promise(async(resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    //const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const salaryQuery = require('../models/db_salary-query');

    //--------------------------------------------------------------------------
    // Fetch months
    //--------------------------------------------------------------------------

    let mode = false;

    if (!arguments.length) {
      mode = true;
      months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }

    //--------------------------------------------------------------------------
    // Main function
    //--------------------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 6;
      const MON_COLS = config.salary_colMonths;
      const DIRECTIONS = config.directions.common;

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let srcRows = {
        'lera': '',
        'olga': ''
      };

      //------------------------------------------------------------------------
      // Read data from dds_lera to RAM
      //------------------------------------------------------------------------

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

      //------------------------------------------------------------------------
      // Refresh table
      //------------------------------------------------------------------------

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

      try {

        let numMonth = [];
        let paramsSalary = [[], [], [], []];

        //= Build params =
        for (let a = (START - 1); a < dataSalary.length; a++) {
          if (dataSalary[a][0] && dataSalary[a][3]) {
            paramsSalary[0].push(dataSalary[a][0]); //name
            paramsSalary[1].push(dataSalary[a][3]); //departion
          } else {
            paramsSalary[0].push(' ');
            paramsSalary[1].push(' ');
          }
        }

        months.forEach(month => {
          numMonth.push(MON_COLS[month][0]);
        });

        paramsSalary[2] = numMonth; //months
        paramsSalary[3] = DIRECTIONS; //directions

        //= Get sum Salary =
        let sum1;
        let sum2;

        //----------------------------------------------------------------------
        // Get common sum Salary
        //----------------------------------------------------------------------

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

        for (let m = 0; m < sum1.length; m++) {
          sumCommon.push([]);
          for (let i = 0; i < sum1[m].length; i++) {
            sumCommon[m].push([Number(sum1[m][i]) + Number(sum2[m][i])]);
          }
        }

        //console.log(sumCommon);

        //----------------------------------------------------------------------
        // Get directions sum Salary
        //----------------------------------------------------------------------

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

        for (let m = 0; m < sum1.length; m++) {
          sumDirections.push([]);
          for (let i = 0; i < sum1[m].length; i++) {
            sumDirections[m].push([]);
            for (let j = 0; j < sum1[m][i].length; j++) {
              sumDirections[m][i].push(
                Number(sum1[m][i][j]) + Number(sum2[m][i][j])
              );
            }
          }
        }

        //----------------------------------------------------------------------
        // To zip result for Directions in stack, prepair array of function
        // and update (Direction & Common)
        //----------------------------------------------------------------------

        let zipValues = [];
        let arrRange_C = [];
        let arrFuncions_C = [];
        let arrRange_D = [];
        let arrFuncions_D = [];

        //= Zip valuses =
        sumDirections.forEach(val => {
          let arrDirections = [];
          for (let a = 0; a < val.length; a++) {
            arrDirections.push(val[a]);
          }
          // !! Hardcode 5 params, in future possible more than that
          zipValues.push(_.zip(
            arrDirections[0],
            arrDirections[1],
            arrDirections[2],
            arrDirections[3],
            arrDirections[4]
          ));
        });

        //= Prepare array of Range & Functions for Common =
        months.forEach(month => {
          arrRange_C.push(list + '!' + MON_COLS[month][1][0] + START + ':' + MON_COLS[month][1][0]);
        });

        sumCommon.forEach((arrValues, i)=> {
          arrFuncions_C.push(crud.updateData(arrValues, config.sid_2017.salary, arrRange_C[i]));
        });

        //= Prepare array of Range & Functions for Direcions =
        months.forEach(month => {
          arrRange_D.push(list + '!' + MON_COLS[month][1][1] + START + ':' + MON_COLS[month][1][5]);
        });

        zipValues.forEach((arrValues, i)=> {
          arrFuncions_D.push(crud.updateData(arrValues, config.sid_2017.salary, arrRange_D[i]));
        });

        //= Update data for Common =
        await Promise.all(arrFuncions_C)
        //  .then(async (results) => {console.log(results);})
          .catch(console.log);

        //= Update data for Directions =
        await Promise.all(arrFuncions_D)
        //  .then(async (results) => {console.log(results);})
          .catch(console.log);

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      if (mode) {
        range = 'main!B15';
      } else {
        range = 'main!C15';
      }
      let now = new Date();
      now = [[formatDate(now)]];
      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = salary;
