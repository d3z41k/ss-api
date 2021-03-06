'use strict';

const config = require('config');

async function finState(nowMonths) {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const getCols = require('../libs/get-cols');
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const sleep = require('../libs/sleep');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      //-------------------------------------------------------------
      // Read data from DDS to RAM
      //-------------------------------------------------------------

      let srcRows = {
        lera: '',
        olga: ''
      };

      //-------------------------------------------------------------
      // Read data from dds_lera to RAM
      //-------------------------------------------------------------

       let list = encodeURIComponent('ДДС_Лера');
       let range = list + '!A6:AC';

      srcRows.lera = await crud.readData(config.ssId.dds, range);
      //srcRows.lera.length = normLength(srcRows.lera);

      //-------------------------------------------------------------
      // Read data from dds_olga to RAM
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AK';

      srcRows.olga = await crud.readData(config.ssId.dds, range);
      //srcRows.olga.length = normLength(srcRows.olga);

      //---------------------------------------------------------------
      // Normalizing of length "srcRows"
      //---------------------------------------------------------------

      // function normLength(srcRows){
      //   for (let i = 0; i < srcRows.length; i++) {
      //     if (srcRows[i][0] == '' &&
      //       srcRows[i + 1][0] == '' &&
      //       srcRows[i + 2][0] == '') {
      //       return srcRows.length = i;
      //     }
      //   }
      // }

      //---------------------------------------------------------------
      // Refresh table
      //---------------------------------------------------------------

      await Promise.all([
        dbRefresh(pool, 'dds_lera', srcRows.lera),
        dbRefresh(pool, 'dds_olga', srcRows.olga)
      ])
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      //await pool.end();

      //-------------------------------------------------------------
      //
      //-------------------------------------------------------------

      let divisions = config.divisions;
      let params = [[], [], []];
      list = encodeURIComponent('МТС');
      range = list + '!B8:B98';
      params[1] = await crud.readData(config.ssId.fin_state, range);
      const factQuery = require('../models/db_fact-query');

      let months = nowMonths;
      let mode = false;

      if (months.length <= 2) {
        mode = true;
      }

      for (let division in divisions) {

        let cols = await getCols(auth, division, divisions[division].length, months);

        //console.log(cols);

        let mon = {
          'Jul': 7,
          'Aug': 8,
          'Sep': 9,
          'Oct': 10,
          'Nov': 11,
          'Dec': 12
        };

        for (let m = 0; m < months.length; m++) {
          params[0][0] = [];
          params[0][0] = mon[months[m]];

          for (let p = 0; p < divisions[division].length; p++) {
            params[2] = [];
            params[2].push(divisions[division][p]);

            //make Promise.all!!!
            let sum1 = await factQuery(pool, 'dds_lera', params);
            let sum2 = await factQuery(pool, 'dds_olga', params);
            let sum = [];

            for (let i = 0; i < sum1.length; i++) {
              sum.push([Number(sum1[i][0]) + Number(sum2[i][0])]);
            }

            list = encodeURIComponent(division);
            range = list + '!' + cols[m].fact[p] + '8:' + cols[m].fact[p] + '98';

            await crud.updateData(sum, config.ssId.fin_state, range)
              .then(async (result) => {console.log(result);})
              .catch(console.log);

            await sleep(1000);

          }
          await sleep(1000);
        }
        await sleep(1000);

        console.log(division);

      }

      //await pool.end();

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      if (mode) {
        range = 'sheet1!C15';
      } else {
        range = 'sheet1!B15';
      }

      let now = new Date();
      now = [
        [formatDate(now)]
      ];

      await crud.updateData(now, config.ssId.monit, range)
      //.then(async (result) => {console.log(result);})
        .catch(console.log);

    } // = End start function =

    resolve('complite!');
  });
}

module.exports = finState;
