'use strict';

const config = require('config');

async function profi1(mon) {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const profiQuery = require('../models/db_profi_query');

    async function handlerParams1(rows, params) {
      return new Promise(async (resolve, reject) => {

        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          params[0].push(rows[1][0]);
          params[1].push(rows[2][0]);
          params[2].push(rows[0][0]);

          resolve(params);
        }

      });
    }

    async function handlerParams2(rows, params) {
      return new Promise(async (resolve, reject) => {

        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          for (let i = 0; i < rows.length; i++) {
            let row = rows[i];

            params[3].push(row[0]);
            params[4].push(row[1]);
            params[5].push(row[4]);

          }
        }

        resolve(params);
      });
    }


    //-------------------------------------------------------------
    // Fetch months
    //-------------------------------------------------------------

    let months = config.months;

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

      let directions = config.directions.profi1;

      //-------------------------------------------------------------
      // Read data from DDS to RAM
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Лера');
      range = list + '!A6:AC';

      let srcRows = await crud.readData(config.ssId.dds, range);

      // = Normalizing of length "srcRows" =
      normLength(srcRows);

       await dbRefresh(pool, 'dds_lera', srcRows)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //-------------------------------------------------------------
      // Read data from Profi to RAM & combine params arrays (2 steps)
      //-------------------------------------------------------------;

      for (let month in months) {

        for (let m = 0; m < directions.length; m++){

          list = encodeURIComponent(directions[m]);

          for (let i = 0; i < months[month].length; i++) {

            range = list + '!' + months[month][i] + '2:' + months[month][i] + '4';

            let dstRows = await crud.readData(config.ssId.profi1, range);

            let params = [[], [], [], [], [], []];
            params = await handlerParams1(dstRows, params);

            range = list + '!C7:G';
            dstRows = await crud.readData(config.ssId.profi1, range);

            params = await handlerParams2(dstRows, params);

            let sumValues = await profiQuery(pool, params);

            //console.log(filalData);

            range = list + '!' + months[month][i] + '7:' + months[month][i];
            await crud.updateData(sumValues, config.ssId.profi1, range)
              .then((result) => {console.log(result);})
              .catch(console.log);

          }

        }
      }

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      if (mode) {
        range = 'sheet1!C11';
      } else {
        range = 'sheet1!B11';
      }

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.ssId.monit, range);

    } //= End start function =

    //crutch for avoid timeout
    resolve('complite!');

  });
}

module.exports = profi1;
