'use strict';

const config = require('config');

async function profi2(mon) {
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
    const pool = require('../models/db_pool');
    const profiQuery = require('../models/db_profi_query');

    async function handlerParams1(rows, params) {
      return new Promise(async (resolve, reject) => {

        if (rows.length == 0) {
          reject('No data found! (handlerParams1)');
        } else {

          rows[2][0] ? params[0].push(rows[2][0]) : '';
          rows[3][0] ? params[1].push(rows[3][0]) : '';
          rows[0][0] ? params[2].push(rows[0][0]) : '';

          resolve(params);
        }

      });
    }

    async function handlerParams2(rows, params) {
      return new Promise(async (resolve, reject) => {

        if (rows.length == 0) {
          reject('No data found! (handlerParams2)');
        } else {

          for (let i = 0; i < rows.length; i++) {
            let row = rows[i];

            row[0] ? params[3].push(row[0]) : '';
            row[1] ? params[4].push(row[1]) : '';
            row[4] ? params[5].push(row[4]) : '';

          }
        }

        resolve(params);
      });
    }

    //-------------------------------------------------------------
    // Fetch months
    //-------------------------------------------------------------

    let months = config.profi_MonCols_2017;
    var nowMonths  = {};
    var mode = 0;


    if (arguments.length) {
      nowMonths[mon[0]] = months[mon[0]];
      nowMonths[mon[1]] = months[mon[1]];
      months =  nowMonths;
      mode = 1;
    }

    //-------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      let list = '';
      let range = '';
      const START = 8;

      let directions = config.directions.profi2;

      //-------------------------------------------------------------
      // Read data from DDS to RAM
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Лера');
      range = list + '!A6:V';

      let srcRows = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "srcRows" =
      //normLength(srcRows);

       await dbRefresh(pool, 'dds_lera', srcRows)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //-------------------------------------------------------------
      // Read data from Profi to RAM & combine params arrays (2 steps)
      //-------------------------------------------------------------;

      for (let month in months) {
        for (let m = 0; m < directions.length; m++){
          list = encodeURIComponent(directions[m]);
          // "- 2" last cols
          for (let i = 0; i < months[month].length - 2; i++) {
            let params = [[], [], [], [], [], []];

            range = list + '!' + months[month][i] + '2:' + months[month][i] + '5';
            let dstRows = await crud.readData(config.sid_2017.profi2, range);
            params = await handlerParams1(dstRows, params);

            range = list + '!C' + START + ':G';
            dstRows = await crud.readData(config.sid_2017.profi2, range);
            params = await handlerParams2(dstRows, params);

            let sumValues = await profiQuery(pool, params);

            range = list + '!' + months[month][i] + START + ':' + months[month][i];
            await crud.updateData(sumValues, config.sid_2017.profi2, range)
              .then((result) => {console.log(result);})
              .catch(console.log);
            await sleep(500);

          }
        }
      }

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      if (mode) {
        range = 'main!C13';
      } else {
        range = 'main!B13';
      }

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

    } //= End start function =

    //crutch for avoid timeout
    resolve('complite!');

  });
}

module.exports = profi2;
