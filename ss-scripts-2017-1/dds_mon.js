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
      const START2 = START + 3;
      const END = 100;
      const DIRECTIONS = config.directions.common_cut;
      const DEC = '(декада)';
      const SIDS = config.sid_2017.dds_mon;

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let dataDDS = {
        lera: '',
        olga: ''
      };

      for (let mon in SIDS) {
        if (SIDS[mon]) {

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

          let paramsMonDDS = [[], [], [], []];
          let commonValues = [];
          let decValuses = [];
          let sum1;
          let sum2;

          try {

            for (let d = 0; d < DIRECTIONS.length; d++) {

              //= Clear =
              paramsMonDDS = [[], [], []];
              commonValues = [];
              decValuses = [];
              sum1 = [];
              sum2 = [];
              let mode = 1;

              //= Get data from 'DDS_Mon' =
              list = encodeURIComponent(DIRECTIONS[d] + DEC);
              range = list + '!B1:C' + END;
              let monDDS = await crud.readData(SIDS[mon], range);

              //= Build params =
              paramsMonDDS[0].push(monDDS[3][0].slice(2));
              paramsMonDDS[1].push(monDDS[1][1].trim());
              paramsMonDDS[3] = ['1', '2', '3'];


              for (let a = (START - 1); a < monDDS.length; a++) {
                if (monDDS[a][0] && monDDS[a][0][0] != '→') {
                  paramsMonDDS[2].push(monDDS[a][0].trim());
                } else {
                  paramsMonDDS[2].push(' ');
                }
              }

              //= Get values =
              await Promise.all([
                dds_monQuery(pool, 'dds_lera', paramsMonDDS, mode),
                dds_monQuery(pool, 'dds_olga', paramsMonDDS, mode)
              ])
                .then(async ([s1, s2]) => {
                  sum1 = s1;
                  sum2 = s2;
                })
                .catch(console.log);


              for (let d = 0; d < sum1.length; d++) {
                decValuses.push([]);
                for (let i = 0; i < sum1[d].length; i++) {
                  decValuses[d].push([Number(sum1[d][i]) + Number(sum2[d][i])]);
                }
              }

              //= Cut values =
              decValuses[0].splice(0, 3);
              decValuses[1].splice(0, 3);
              decValuses[2].splice(0, 3);

              range = list + '!E' + START2 + ':E' + END;
              range1 = list + '!H' + START2 + ':H' + END;
              range2 = list + '!K' + START2 + ':K' + END;

              await Promise.all([
                crud.updateData(decValuses[0], SIDS[mon], range),
                crud.updateData(decValuses[1], SIDS[mon], range1),
                crud.updateData(decValuses[2], SIDS[mon], range2)

              ])
              //  .then(async results => {console.log(results);})
                .catch(console.log);

              //----------------------------------------------------------------
              // Update Common values
              //----------------------------------------------------------------

              mode = 0;

              await Promise.all([
                dds_monQuery(pool, 'dds_lera', paramsMonDDS, mode),
                dds_monQuery(pool, 'dds_olga', paramsMonDDS, mode)
              ])
                .then(async ([s1, s2]) => {
                  sum1 = s1;
                  sum2 = s2;
                })
                .catch(console.log);

              for (let i = 0; i < sum1.length; i++) {
                commonValues.push([Number(sum1[i]) + Number(sum2[i])]);
              }

              //= Update data =
              range = list + '!N' + START + ':N' + END;

              await crud.updateData(commonValues, SIDS[mon], range)
              //  .then(async results => {console.log(results);})
                .catch(console.log);

              await sleep(1000);
            }// end direcions loop

          } catch (e) {
            reject(e.stack);
          }

          // //------------------------------------------------------------------------
          // // Update date-time in "Monitoring"
          // //------------------------------------------------------------------------
          //
          // // range = 'main!B9';
          // //
          // // let now = new Date();
          // // now = [[formatDate(now)]];
          // //
          // // await crud.updateData(now, config.sid_2017.monit, range);

        }
        await sleep(1000);
      } // end SIDS loop

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = dds_mon;
