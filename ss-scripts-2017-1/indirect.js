'use strict';

const config = require('config');
const _ = require('lodash/array');

async function indirect(months) {
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
    const indirectQuery = require('../models/db_indirect-query');

    //--------------------------------------------------------------------------
    // Fetch months
    //--------------------------------------------------------------------------

    // let mode = false;
    //
    // if (!arguments.length) {
    //   mode = true;
    //   months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    // }

    //--------------------------------------------------------------------------
    // Main function
    //--------------------------------------------------------------------------

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
      let srcRows = {
        lera: '',
        olga: ''
      };

      let mode = false;

      if (!months) {
        mode = true;
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      }

      // //-------------------------------------------------------------
      // // Read data from dds_lera to RAM
      // //-------------------------------------------------------------
      //
      // list = encodeURIComponent('ДДС_Лера');
      // range1 = list + '!A6:V';
      //
      // list = encodeURIComponent('ДДС_Ольга');
      // range2 = list + '!A6:AD';
      //
      // await Promise.all([
      //   crud.readData(config.sid_2017.dds, range1),
      //   crud.readData(config.sid_2017.dds, range2)
      // ])
      //  .then(async ([dds_lera, dds_olga]) => {
      //     srcRows.lera = dds_lera;
      //     srcRows.olga = dds_olga;
      //   })
      //   .catch(console.log);
      //
      // //---------------------------------------------------------------
      // // Refresh table
      // //---------------------------------------------------------------
      //
      // await Promise.all([
      //   dbRefresh(pool, 'dds_lera', srcRows.lera),
      //   dbRefresh(pool, 'dds_olga', srcRows.olga)
      // ])
      //   //.then(async (results) => {console.log(results);})
      //   .catch(console.log);

      //------------------------------------------------------------------------
      // Get data from 'Indirect'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Косвенные (факт)');
      range = list + '!A1:E';
      let dataIndirect = await crud.readData(config.sid_2017.indirect, range);

      //------------------------------------------------------------------------
      // Build paramsIndirect and get & update Indirect
      //------------------------------------------------------------------------

        let paramsIndirect = {
          '1.1' : [[], []],
          '1.2' : [[], [], []],
          '1.3' : [[], [], []],
          '2.1' : [[], [], [], []],
          '2.2' : [[], [], [], []],
          '2.3' : [[], [], [], []],
        };

        let numMonth = [];

        //= Build params for Indirect (3 type, 2 version) =

        months.forEach(month => {
          numMonth.push(MON_COLS[month][0]);
        });

        for (let type in paramsIndirect) {
          paramsIndirect[type][0] = numMonth; //months
          if (type[0] == '2') {
            paramsIndirect[type][3] = DIRECTIONS; //directions
          }
        }

        for (let i = (START - 1); i < dataIndirect.length; i++) {

          //= Type 1.1 params =
          if ((i >= TYPES[1.1].range1[0] && i <= TYPES[1.1].range1[1])
            || (i >= TYPES[1.1].range2[0] && i <= TYPES[1.1].range2[1] && i != range2[2])
            || (i >= TYPES[1.1].range3)
          ) {
            paramsIndirect['1.1'][1].push(dataIndirect[i][1]); //articles
            paramsIndirect['2.1'][1].push(dataIndirect[i][1]); //articles
          }

          //= Type 1.2 params =
          if (i >= TYPES[1.2].range1[0] && i <= TYPES[1.2].range1[1]) {
            paramsIndirect['1.2'][1].push(dataIndirect[i][1]); //articles
            paramsIndirect['1.2'][2].push(dataIndirect[i][3]); //transcript
            paramsIndirect['2.2'][1].push(dataIndirect[i][1]); //articles
            paramsIndirect['2.2'][2].push(dataIndirect[i][3]); //transcript
          }

          //= Type 1.3 params =
          if (i >= TYPES[1.3].range1[0] && i <= TYPES[1.3].range1[1]) {
            paramsIndirect['1.3'][1].push(dataIndirect[i][1]); //articles
            paramsIndirect['1.3'][2].push(dataIndirect[i][2]); //company
            paramsIndirect['2.3'][1].push(dataIndirect[i][1]); //articles
            paramsIndirect['2.3'][2].push(dataIndirect[i][2]); //company
          }

        }

        //= Make query to DDS for Indirect  for each type-version (1.1, 1.2 ...)=
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

            //= For version 1 =
            if (type[0] == ['1']) {
              for (let m = 0; m < sum1.length; m++) {
                sumCommon.push([]);
                for (let i = 0; i < sum1[m].length; i++) {
                  sumCommon[m].push([Number(sum1[m][i]) + Number(sum2[m][i])]);
                }
              }
            }

            //= For version 2 =
            if (type[0] == ['2']) {
              for (let m = 0; m < sum1.length; m++) {
                sumDirections.push([]);
                for (let d = 0; d < sum1[m].length; d++) {
                  sumDirections[m].push([]);
                  for (let i = 0; i < sum1[m][d].length; i++) {
                    sumDirections[m][d].push(Number(sum1[m][d][i]) + Number(sum2[m][d][i]));
                  }
                }
              }
            }

            //console.log(require('util').inspect(sumCommon, { depth: null }));

            let zipValues = [];
            let zipValues1 = [];
            let zipValues2 = [];
            let zipValues3 = [];
            let arrRange1 = [];
            let arrRange2 = [];
            let arrRange3 = [];
            let arrFuncions1 = [];
            let arrFuncions2 = [];
            let arrFuncions3 = [];
            let startIndex;
            let endIndex;

            //------------------------------------------------------------------
            // Type 1.1 & 2.1 (3 part)
            //------------------------------------------------------------------
            if (type == '1.1' || type == '2.1') {

              if(type == '1.1'){

                zipValues = sumCommon;
                startIndex = 0;
                endIndex = 0;

              } else if(type == '2.1') {


                startIndex = 1;
                endIndex = 5;

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

              }

              //----------------------------------------------------------------
              // Common part of type 1.1 & 2.1 (3 part)
              //----------------------------------------------------------------

              //= Split zipValues =
              zipValues.forEach((monthVal, m) => {
                zipValues1.push([]);
                zipValues2.push([]);
                zipValues3.push([]);
                monthVal.forEach((lineVal, l) => {
                  if (l <= 26) {
                    zipValues1[m].push(lineVal);
                  } else if (l >= 27 && l <= 50) {
                    zipValues2[m].push(lineVal);
                  } else {
                    zipValues3[m].push(lineVal);
                  }
                });
              });

              //= Prepare array of Range & Functions =
              start = TYPES[type].range1[0] + 1;
              end = TYPES[type].range1[1] + 1;

              months.forEach(month => {
                arrRange1.push(list + '!' + MON_COLS[month][1][startIndex] + start + ':'
                  + MON_COLS[month][1][endIndex] + end);
              });

              start = TYPES[type].range2[0] + 1;
              end = TYPES[type].range2[1] + 1;

              months.forEach(month => {
                arrRange2.push(list + '!' + MON_COLS[month][1][startIndex] + start + ':'
                + MON_COLS[month][1][endIndex] + end);
              });

              start = TYPES[type].range3 + 1;

              months.forEach(month => {
                arrRange3.push(list + '!' + MON_COLS[month][1][startIndex] + start);
              });

              zipValues1.forEach((arrValues, i)=> {
                arrFuncions1.push(crud.updateData(arrValues, config.sid_2017.indirect, arrRange1[i]));
              });

              zipValues2.forEach((arrValues, i)=> {
                arrFuncions2.push(crud.updateData(arrValues, config.sid_2017.indirect, arrRange2[i]));
              });

              zipValues3.forEach((arrValues, i)=> {
                arrFuncions3.push(crud.updateData(arrValues, config.sid_2017.indirect, arrRange3[i]));
              });

              //= Async update data for Directions =
              Promise.all(arrFuncions1)
                .then(async (results) => {console.log(results);})
                .catch(console.log);

              Promise.all(arrFuncions2)
                .then(async (results) => {console.log(results);})
                .catch(console.log);

              Promise.all(arrFuncions3)
                .then(async (results) => {console.log(results);})
                .catch(console.log);

            //------------------------------------------------------------------
            // Other types
            //------------------------------------------------------------------
            } else {
              //= Type 1 (1.2, 1.3) sum =
                if (type[0] == '1') {

                  zipValues = sumCommon;
                  startIndex = 0;
                  endIndex = 0;

                  start = TYPES[type].range1[0] + 1;
                  end = TYPES[type].range1[1] + 1;

                  months.forEach(month => {
                    arrRange1.push(list + '!' + MON_COLS[month][1][startIndex] + start + ':'
                      + MON_COLS[month][1][endIndex] + end);
                  });

                  zipValues.forEach((arrValues, i)=> {
                    arrFuncions1.push(crud.updateData(arrValues, config.sid_2017.indirect, arrRange1[i]));
                  });

                  await Promise.all(arrFuncions1)
                  //  .then(async (results) => {console.log(results);})
                    .catch(console.log);

                //= Type 2 (2.2, 2.3) sum =
              } else if (type[0] == '2') {

                  startIndex = 1;
                  endIndex = 5;

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

                  //console.log(zipValues);

                  start = TYPES[type].range1[0] + 1;
                  end = TYPES[type].range1[1] + 1;

                  months.forEach(month => {
                    arrRange1.push(list + '!' + MON_COLS[month][1][startIndex] + start + ':'
                      + MON_COLS[month][1][endIndex] + end);
                  });

                  zipValues.forEach((arrValues, i)=> {
                    arrFuncions1.push(crud.updateData(arrValues, config.sid_2017.indirect, arrRange1[i]));
                  });

                  await Promise.all(arrFuncions1)
                  //  .then(async (results) => {console.log(results);})
                    .catch(console.log);

                }

            }

          await sleep(1000);



      } //end Types loop

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      if (mode) {
        range = 'main!B16';
      } else {
        range = 'main!C16';
      }

      let now = new Date();
      now = [[formatDate(now)]];
      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = indirect;
