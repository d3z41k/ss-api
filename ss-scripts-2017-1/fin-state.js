'use strict';

const config = require('config');
const _ = require('lodash/array');

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



    if (arguments.length) {
      let indexMonths = config.months;
      var months = [indexMonths[nowMonths]];
    } else {
      months = [1, 2, 3, 4, 5, 6];
    }

    if (months.length == 1) {
      var mode = true;
    } else {
      mode = false;
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

      range = list.dds_lera + '!A6:AC';
      srcRows.lera = await crud.readData(config.ssId.dds, range);

      range = list.dds_olga + '!A6:AK';
      srcRows.olga = await crud.readData(config.ssId.dds, range);

      await Promise.all([
        dbRefresh(pool, 'dds_lera', srcRows.lera),
        dbRefresh(pool, 'dds_olga', srcRows.olga)
      ])
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Build params
      //------------------------------------------------------------------------

      let divisions = config.divisions_2017;

      let params = [[], [], []];
      range = list.mts + '!B' + START + ':B' + END;

      params[0] = months; //months
      params[1] = await crud.readData(config.sid_2017.fin_state, range); //articles



        for (let division in divisions) {

          params[2] = Object.keys(divisions[division]);

          //console.log(params);
          let dataModel = {};
          let dataPlan = [];
          let dataFact = [];
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
            dataFact.push([]);
            for (let d = 0; d < sum1[m].length; d++) {
              dataFact[m].push([]);
              for (let i = 0; i < sum1[m][d].length; i++) {
                dataFact[m][d].push(Number(sum1[m][d][i]) + Number(sum2[m][d][i]));
              }
            }
          }

        //------------------------------------------------------------------------

          range = encodeURIComponent(division + '(план)') + '!B1:98';
          dataModel[division] = await crud.readData(config.sid_2017.fin_model, range);

          //console.log(params);

          for (let m = 0; m < params[0].length; m++) {
            dataPlan.push([]);
            for (let d = 0; d < Object.keys(divisions[division]).length; d++) {
              dataPlan[m].push([]);
              for (let i = 0; i < params[1].length; i++) {
                for (let v = 0; v < dataModel[division].length; v++) {
                  for (let h = 0; h < dataModel[division][0].length; h++) {
                    if (dataModel[division][0][h] == params[0][m]
                      && dataModel[division][4][h].trim() == params[2][d]
                      && dataModel[division][v][0] == params[1][i]
                    ) {
                      dataPlan[m][d].push(dataModel[division][v - 1][h]);
                    }
                  }
                }
              }
            }
          }

        //  console.log(require('util').inspect(dataFact, { depth: null }));

          let zipValues = [];
          let arrRange = [];
          let arrFuncions = [];

          dataPlan.forEach((mArray, m) => {
            zipValues.push([]);
            mArray.forEach((dArray, d) => {
              zipValues[m].push(_.zip(dArray, dataFact[m][d]));
            });
          });

          for (let m = 0; m < zipValues.length; m++) {
            let total = zipValues[m][zipValues[m].length - 1];
            for (let i = 0; i < total.length; i++) {
              zipValues[m][zipValues[m].length - 1][i] = [total[i][0], null];
            }
          }

          //console.log(require('util').inspect(zipValues, { depth: null }));

          for (let m = 0; m < months.length; m++) {
            arrRange.push([]);
            for (let d = 0; d < Object.keys(divisions[division]).length; d++) {
              let list = encodeURIComponent(division)
              arrRange[m].push(list + '!'
                + divisions[division][Object.keys(divisions[division])[d]][months[m]][0]
                + START + ':'
                + divisions[division][Object.keys(divisions[division])[d]][months[m]][1]
              );
            }
          }

          zipValues.forEach((arrValues, m) => {
            arrFuncions.push([]);
            arrValues.forEach((values, d) => {
              arrFuncions[m].push(crud.updateData(values, config.sid_2017.fin_state, arrRange[m][d]));
            });
          });

          for (let m = 0; m < arrFuncions.length; m++) {
            await Promise.all(arrFuncions[m])
            //  .then(async (results) => {console.log(results);})
              .catch(console.log);
            await sleep(1000);
          } //end months

          await sleep(5000);

        } //end divisions

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      if (mode) {
        range = 'main!C22';
      } else {
        range = 'main!B22';
      }

      let now = new Date();
      now = [
        [formatDate(now)]
      ];

      await crud.updateData(now, config.sid_2017.monit, range)
      //.then(async (result) => {console.log(result);})
        .catch(console.log);

    } // = End start function =

    resolve('complite!');
  });
}

module.exports = finState;
