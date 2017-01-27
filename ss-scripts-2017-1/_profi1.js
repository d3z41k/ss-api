'use strict';

const config = require('config');
const _ = require('lodash/array');

async function profi1(months) {
  return new Promise(async (resolve, reject) => {

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
    const profiQuery = require('../models/_db_profi-query');

    //-------------------------------------------------------------
    // Fetch months
    //-------------------------------------------------------------

    let colMonths = config.profi_MonCols_2017;
    let nowMonths  = {};
    let mode = 0;

    if (arguments.length) {
      nowMonths[months[0]] = colMonths[months[0]];
      nowMonths[months[1]] = colMonths[months[1]];
      colMonths = nowMonths;
      mode = 1;
    }

    //----------------------------------------------------------------
    // Main function Start
    //----------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      let list = '';
      let range = '';
      const START = 8;

      let directions = config.directions.profi1;

      //--------------------------------------------------------------
      // Read data from DDS to RAM
      //--------------------------------------------------------------

      list = encodeURIComponent('ДДС_Лера');
      range = list + '!A6:V';

      let dataDDS = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "dataDDS" =
      //normLength(dataDDS);

      await dbRefresh(pool, 'dds_lera', dataDDS)
      //  .then(async (result) => {console.log(result);})
        .catch(console.log);

      //---------------------------------------------------------------

      try {

        //--------------------------------------------------------------
        // Build *static* Profi params
        //--------------------------------------------------------------

        let paramsProfi = [[], [], [], [], [], []];
        let dataProfi = '';
        let namesMonths = [];

        list = encodeURIComponent(directions[0]);

        for (let month in colMonths) {
          paramsProfi[2].push(colMonths[month][0]); //Number of months
          namesMonths.push(month);
          range = list + '!' + colMonths[month][1][0] + '2:' + colMonths[month][1][3] + '5';
        }

        dataProfi = await crud.readData(config.sid_2017.profi1, range);

        paramsProfi[0].push(dataProfi[2][0]); //directions
        paramsProfi[1].push(
          dataProfi[3][0],
          dataProfi[3][1],
          dataProfi[3][2],
          dataProfi[3][3]
        ); //articles

        for (let d = 0; d < directions.length; d++){

          //--------------------------------------------------------------
          // Build *dynamic* Profi params
          //--------------------------------------------------------------

          //= Clear *dynamic* Profi params=
          paramsProfi[3] = [];
          paramsProfi[4] = [];
          paramsProfi[5] = [];

          list = encodeURIComponent(directions[d]);
          range = list + '!C' + START + ':G';
          dataProfi = await crud.readData(config.sid_2017.profi1, range);

          for (let i = 0; i < dataProfi.length; i++) {
            let row = dataProfi[i];
            row[0] ? paramsProfi[3].push(row[0]) : ''; //themes
            row[1] ? paramsProfi[4].push(row[1]) : ''; //city
            row[4] ? paramsProfi[5].push(row[4]) : ''; //counterparty
          }

          //--------------------------------------------------------------
          // Get result of The profiQuery
          //--------------------------------------------------------------

          let values = await profiQuery(pool, paramsProfi);

          //--------------------------------------------------------------
          // To zip result in stack, prepair array of function and update
          //--------------------------------------------------------------

          let zipValues = [];
          let arrRange = [];
          let arrFuncions = [];

          //= Zip valuses =
          values.forEach(val => {
            let arrArticles = [];
            for (let a = 0; a < val.length; a++) {
              arrArticles.push(val[a]);
            }
            // !! Hardcode 4 params, in future possible more than that
            zipValues.push(_.zip(
              arrArticles[0],
              arrArticles[1],
              arrArticles[2],
              arrArticles[3]
            ));
          });

          //= Prepare array of Range =
          for (let month in colMonths){
            arrRange.push(list + '!' + colMonths[month][1][0] + START + ':' + colMonths[month][1][3]);
          }

          //= Prepare array of Functions =
          zipValues.forEach((arrValues, i)=> {
            arrFuncions.push(crud.updateData(arrValues, config.sid_2017.profi1, arrRange[i]));
          });

          //= Update data =
          await Promise.all(arrFuncions)
            .then(async (results) => {console.log(results);})
            .catch(console.log);

          await sleep(800);

          console.log(directions[d]);

        } //= End directions =

      } catch (e) {
        reject(e.stack);
      }

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      if (mode) {
        range = 'main!C12';
      } else {
        range = 'main!B12';
      }
      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

    } //= End start function =

    //crutch for avoid timeout
    resolve('complite!');

  });
}

module.exports = profi1;
