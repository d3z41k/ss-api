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
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const sleep = require('../libs/sleep');
    const factQuery = require('../models-2017-1/db_fact-query');

    let indexMonths = {
      'Jan': 1,
      'Feb': 2,
      'Mar': 3,
      'Apr': 4,
      'May': 5,
      'Jun': 6
    };

    if (arguments.length) {
      var months = [indexMonths[nowMonths]];
    } else {
      months = [1, 2, 3, 4, 5, 6];
    }

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 8;
      const END = 98;

      let range = '';
      let list = {
        'dds_lera': encodeURIComponent('ДДС_Лера'),
        'dds_olga': encodeURIComponent('ДДС_Ольга'),
        'mts': encodeURIComponent('МТС')
      };
      let srcRows = {
        lera: '',
        olga: ''
      };


      //-------------------------------------------------------------
      // Refresh DDS table
      //-------------------------------------------------------------

      // range = list.dds_lera + '!A6:AC';
      // srcRows.lera = await crud.readData(config.ssId.dds, range);
      //
      // range = list.dds_olga + '!A6:AK';
      // srcRows.olga = await crud.readData(config.ssId.dds, range);
      //
      // await Promise.all([
      //   dbRefresh(pool, 'dds_lera', srcRows.lera),
      //   dbRefresh(pool, 'dds_olga', srcRows.olga)
      // ])
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.log);

      //------------------------------------------------------------------------
      // Build params
      //------------------------------------------------------------------------

      let divisions = config.divisions_2017;
      let params = [[], [], []];
      range = list.mts + '!B' + START + ':B' + END;

      params[0] = months; //months
      params[1] = await crud.readData(config.sid_2017.fin_state, range); //articles

      // params[1] = params[1].map(val => {
      //   return val.trim();
      // });

      if (months.length <= 1) {
        let mode = true;
      } else {
        let mode = false;
      }

      for (let division in divisions) {
        params[2].push(Object.keys(divisions[division]));
      } //end divisions

      //console.log(params);
      let sum = [];
      let sum1;
      let sum2;

      await Promise.all([
        factQuery(pool, 'dds_lera', params),
        factQuery(pool, 'dds_olga', params)
      ])
        .then(async ([s1, s2]) => {
          sum1 = s1;
          sum2 = s2;
        })
        .catch(console.log);

      for (let m = 0; m < sum1.length; m++) {
        sum.push([]);
        for (let d = 0; d < sum1[m].length; d++) {
          sum[m].push([]);
          for (let sd = 0; sd < sum1[m][d].length; sd++) {
            sum[m][d].push([]);
            for (let i = 0; i < sum1[m][d][sd].length; i++) {
              sum[m][d][sd].push(Number(sum1[m][d][sd][i]) + Number(sum2[m][d][sd][i]));
            }
          }
        }
      }

      console.log(require('util').inspect(sum, { depth: null }));


  //
  //  list = encodeURIComponent(division);
  //  range = list + '!' + cols[m].fact[p] + '8:' + cols[m].fact[p] + '98';
  //
  //  await crud.updateData(sum, config.ssId.fin_state, range)
  //    .then(async (result) => {console.log(result);})
  //    .catch(console.log);
  //
  //  await sleep(1000);
  //
  //}
  //await sleep(1000);

      //console.log(division);



      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      // if (mode) {
      //   range = 'sheet1!C15';
      // } else {
      //   range = 'sheet1!B15';
      // }
      //
      // let now = new Date();
      // now = [
      //   [formatDate(now)]
      // ];
      //
      // await crud.updateData(now, config.ssId.monit, range)
      // //.then(async (result) => {console.log(result);})
      //   .catch(console.log);

    } // = End start function =

    resolve('complite!');
  });
}

module.exports = finState;
