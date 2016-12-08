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
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');

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

      let directions = config.directions.profi1;

      //-------------------------------------------------------------
      // Read data from DDS to RAM
      //-------------------------------------------------------------

      let list = encodeURIComponent('ДДС_Лера');
      let range = list + '!A6:AC';

      let srcRows = await crud.readData(config.ssId.dds, range);
      srcRows.length = normLength(srcRows);

      //-------------------------------------------------------------
      // Normalizing of length "srcRows"
      //-------------------------------------------------------------

      function normLength(srcRows){
        for (let i = 0; i < srcRows.length; i++) {
          if (srcRows[i][0] == '' &&
            srcRows[i + 1][0] == '' &&
            srcRows[i + 2][0] == '') {
            return srcRows.length = i;
          }
        }
      }

      //console.log(srcRows[0][5]);

       await dbRefresh(pool, 'dds_lera', srcRows)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //-------------------------------------------------------------
      // Read data from Profi to RAM & combine params arrays (2 steps)
      //-------------------------------------------------------------;

      // const profiQuery = require('../models/db_profi-query');
      //
      // for (let month in months) {
      //
      //   for (let m = 0; m < directions.length; m++){
      //
      //     list = encodeURIComponent(directions[m]);
      //
      //     for (let i = 0; i < months[month].length; i++) {
      //
      //       range = list + '!' + months[month][i] + '2:' + months[month][i] + '4';
      //
      //       let dstRows = await crud.readData(config.ssId.dev_prof1, range);
      //
      //       let params = [[], [], [], [], [], []];
      //       params = await handlerParams1(dstRows, params);
      //
      //       range = list + '!C7:G';
      //       dstRows = await crud.readData(config.ssId.dev_prof1, range);
      //
      //       params = await handlerParams2(dstRows, params);
      //
      //       let sumValues = await profiQuery(pool, params);
      //
      //       //console.log(filalData);
      //
      //       range = list + '!' + months[month][i] + '7:' + months[month][i];
      //       await crud.updateData(sumValues, config.ssId.dev_prof1, range)
      //         .then((result) => {console.log(result)});
      //
      //     }
      //
      //   }
      // }

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      // if (mode) {
      //   range = 'sheet1!C11';
      // } else {
      //   range = 'sheet1!B11';
      // }
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.ssId.monit, range);

    }

    //crutch for avoid timeout
    resolve('complite!');

  });
}

module.exports = profi1;
