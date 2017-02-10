'use strict';

const config = require('config');

async function dds_mon() {
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
    const dds_monQuery = require('../models/db_dds_mon-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 8;
      const END = 100;
      const DIRECTIONS = config.directions.common_cut;
      const DEC = '(декада)';

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let dataDDS = {
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
          dataDDS.lera = dds_lera;
          dataDDS.olga = dds_olga;
        })
        .catch(console.log);

      //---------------------------------------------------------------
      // Refresh table
      //---------------------------------------------------------------

      await Promise.all([
        dbRefresh(pool, 'dds_lera', dataDDS.lera),
        dbRefresh(pool, 'dds_olga', dataDDS.olga)
      ])
        //.then(async (results) => {console.log(results);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Build paramsMonDDS and get & update
      //------------------------------------------------------------------------

      let paramsMonDDS = [[], [], []];
      let values = [];
      let sum1;
      let sum2;

      try {

        for (let d = 0; d < DIRECTIONS.length; d++) {

          //= Get data from 'DDS_Jan' =
          list = encodeURIComponent(DIRECTIONS[d] + DEC);
          range = list + '!B1:C' + END;
          let monDDS = await crud.readData(config.sid_2017.dds_jan, range);

          //= Build params =
          paramsMonDDS[0].push(monDDS[3][0].slice(2));
          paramsMonDDS[1].push(monDDS[1][1].trim());


          for (let a = (START - 1); a < monDDS.length; a++) {
            if (monDDS[a][0] && monDDS[a][0][0] != '→') {
              paramsMonDDS[2].push(monDDS[a][0].trim());
            } else {
              paramsMonDDS[2].push(' ');
            }
          }

          //= Get values =
          await Promise.all([
            dds_monQuery(pool, 'dds_lera', paramsMonDDS),
            dds_monQuery(pool, 'dds_olga', paramsMonDDS)
          ])
            .then(async ([s1, s2]) => {
              sum1 = s1;
              sum2 = s2;
            })
            .catch(console.log);

          for (let i = 0; i < sum1.length; i++) {
            values.push([Number(sum1[i]) + Number(sum2[i])]);
          }

          console.log(values);

          //= Update data =
          range = list + '!N' + START + ':N' + END;

          // await crud.updateData(values, config.sid_2017.dds_jan, range)
          // //  .then(async results => {console.log(results);})
          //   .catch(console.log);

          await sleep(1000);
        }// end direcions loop

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!B9';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017.monit, range);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = dds_mon;
