'use strict';

const config = require('config');

async function indirect(month) {
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
    const indirectQuery = require('../models/db_indirect-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 7;
      const MON_COLS = config.indirect_colMonths;
      const TYPES = config.indirect_types;
      const DIRECTIONS = config.directions.common;

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let range3 = '';
      let mode = 0;
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
      // Get data from 'Indirect'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Косвенные (факт)');
      range = list + '!A1:E';
      let dataIndirect = await crud.readData(config.sid_2017.indirect, range);

      //------------------------------------------------------------------------
      // Build paramsSlary and get & update Salary
      //------------------------------------------------------------------------

      let paramsIndirect = {
        '1.1' : [[], []],
        '1.2' : [[], [], []],
        '1.3' : [[], [], []],
        '2.1' : [[], [], []],
        '2.2' : [[], [], [], []],
        '2.3' : [[], [], [], []],
      };

      let numMonth = MON_COLS[month][0];

      try {

        for (let type in paramsIndirect) {
          paramsIndirect[type][0].push(numMonth);
          if (type[0] == '2') {
            paramsIndirect[type][3] = DIRECTIONS;
          }
        }

        for (let i = (START - 1); i < dataIndirect.length; i++) {

          //= Type 1.1  =

          if ((i >= TYPES[1.1].range1[0] && i <= TYPES[1.1].range1[1])
            || (i >= TYPES[1.1].range2[0] && i <= TYPES[1.1].range2[1] && i != range2[2])
            || (i == TYPES[1.1].range3)
          ) {
            paramsIndirect['1.1'][1].push(dataIndirect[i][1]);
            paramsIndirect['2.1'][1].push(dataIndirect[i][1]);
          }

          //= Type 1.2  =

          if (i >= TYPES[1.2].range1[0] && i <= TYPES[1.2].range1[1]) {
            paramsIndirect['1.2'][1].push(dataIndirect[i][1]);
            paramsIndirect['1.2'][2].push(dataIndirect[i][3]);
            paramsIndirect['2.2'][1].push(dataIndirect[i][1]);
            paramsIndirect['2.2'][2].push(dataIndirect[i][3]);
          }

          //= Type 1.3  =

          if (i >= TYPES[1.3].range1[0] && i <= TYPES[1.3].range1[1]) {
            paramsIndirect['1.3'][1].push(dataIndirect[i][1]);
            paramsIndirect['1.3'][2].push(dataIndirect[i][2]);
            paramsIndirect['2.3'][1].push(dataIndirect[i][1]);
            paramsIndirect['2.3'][2].push(dataIndirect[i][2]);
          }

        }


      } catch (e) {
        reject(e.stack);
      } finally {

        for (let type in paramsIndirect) {

          let sum1;
          let sum2;
          let sumCommon = [];
          let sumDirections = [];
          let start = 0;
          let end = 0;

          await Promise.all([
            indirectQuery(pool, 'dds_lera', paramsIndirect, type),
            indirectQuery(pool, 'dds_olga', paramsIndirect, type)
          ])
            .then(async ([s1, s2]) => {
              sum1 = s1;
              sum2 = s2;
            })
            .catch(console.log);

            if (type[0] == ['1']) {
              for (let i = 0; i < sum1.length; i++) {
                sumCommon.push([Number(sum1[i][0]) + Number(sum2[i][0])]);
              }
            }

            if (type[0] == ['2']) {
              for (let i = 0; i < sum1.length; i++) {
                  sumDirections.push([]);
                  for (let j = 0; j < sum1[i].length; j++) {
                    sumDirections[i].push([Number(sum1[i][j][0]) + Number(sum2[i][j][0])]);
                  }
                }
            }


            if (type == '1.1') {

              start = TYPES[type].range1[0] + 1;
              end = TYPES[type].range1[1] + 1;

              range1 = list + '!' + MON_COLS[month][1][0] + start + ':'
                  + MON_COLS[month][1][0] + end;

              start = TYPES[type].range2[0] + 1;
              end = TYPES[type].range2[1] + 1;

              range2 = list + '!' + MON_COLS[month][1][0] + start + ':'
                  + MON_COLS[month][1][0] + end;

              range3 = list + '!' + MON_COLS[month][1][0] + TYPES[type].range3;

              let sumCommon1 = [];
              let sumCommon2 = [];
              let sumCommon3 = [];

              sumCommon.forEach((value, i) => {
                if (i <= 26) {
                  sumCommon1.push(value);
                } else if (i >= 27 && i <= 51) {
                  sumCommon2.push(value);
                } else {
                  sumCommon3.push(value);
                }
              });

              await Promise.all([
                crud.updateData(sumCommon1, config.sid_2017.indirect, range1),
                crud.updateData(sumCommon2, config.sid_2017.indirect, range2),
                crud.updateData(sumCommon3, config.sid_2017.indirect, range3)
              ])
                .then(async results => {console.log(results);})
                .catch(console.log);

            } else if (type == '2.1') {
                for (let d = 0; d < paramsIndirect[type][3].length; d++) {
                  start = TYPES[type].range1[0] + 1;
                  end = TYPES[type].range1[1] + 1;

                  range1 = list + '!' + MON_COLS[month][1][d + 1] + start + ':'
                      + MON_COLS[month][1][d + 1] + end;

                  start = TYPES[type].range2[0] + 1;
                  end = TYPES[type].range2[1] + 1;

                  range2 = list + '!' + MON_COLS[month][1][d + 1] + start + ':'
                      + MON_COLS[month][1][d + 1] + end;

                  range3 = list + '!' + MON_COLS[month][1][d + 1] + TYPES[type].range3;

                  let sumDirections1 = [];
                  let sumDirections2 = [];
                  let sumDirections3 = [];

                  sumDirections[d].forEach((value, i) => {
                    if (i <= 26) {
                      sumDirections1.push(value);
                    } else if (i >= 27 && i <= 51) {
                      sumDirections2.push(value);
                    } else {
                      sumDirections3.push(value);
                    }
                  });

                  await Promise.all([
                    crud.updateData(sumDirections1, config.sid_2017.indirect, range1),
                    crud.updateData(sumDirections2, config.sid_2017.indirect, range2),
                    crud.updateData(sumDirections3, config.sid_2017.indirect, range3)
                  ])
                    .then(async results => {console.log(results);})
                    .catch(console.log);
                }

            } else {

              if (type[0] == '1') {

                start = TYPES[type].range1[0] + 1;
                end = TYPES[type].range1[1] + 1;

                range = list + '!' + MON_COLS[month][1][0] + start + ':'
                    + MON_COLS[month][1][0] + end;

                await crud.updateData(sumCommon, config.sid_2017.indirect, range)
                  .then(async results => {console.log(results);})
                  .catch(console.log);
              }

              if (type[0] == '2') {
                for (let d = 0; d < paramsIndirect[type][3].length; d++) {
                  start = TYPES[type].range1[0] + 1;
                  end = TYPES[type].range1[1] + 1;

                  range = list + '!' + MON_COLS[month][1][d + 1] + start + ':'
                      + MON_COLS[month][1][d + 1] + end;

                  await crud.updateData(sumDirections[d], config.sid_2017.indirect, range)
                    .then(async results => {console.log(results);})
                    .catch(console.log);
                }
              }

            }

        }

      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!C16';
      let now = new Date();
      now = [[formatDate(now)]];
      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = indirect;
