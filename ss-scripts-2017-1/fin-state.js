'use strict';

const config = require('config');
const _ = require('lodash/array');

async function finState() {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    //const sleep = require('../libs/sleep');
    const factQuery = require('../models-2017-1/db_fact-query');

    let months = [1, 2, 3, 4, 5, 6];

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 8;
      const END = 100;

      let range = '';
      let range1 = '';
      let range2 = '';
      let list = {
        'dds_lera': encodeURIComponent('ДДС_Лера'),
        'dds_olga': encodeURIComponent('ДДС_Ольга'),
        'mts': encodeURIComponent('МТС')
      };
      let srcRows = {
        lera: '',
        olga: ''
      };

      let divisions = config.divisions_2017;
      let rangeDirections = config.rangeDirections;

      //-------------------------------------------------------------
      // Refresh DDS table
      //-------------------------------------------------------------

      range1 = list.dds_lera + '!A6:V';
      range2 = list.dds_olga + '!A6:AD';

      await Promise.all([
        crud.readData(config.sid_2017.dds, range1),
        crud.readData(config.sid_2017.dds, range2)
      ])
       .then(async ([dds_lera, dds_olga]) => {
          srcRows.lera = dds_lera;
          srcRows.olga = dds_olga;
        })
        .catch(console.log);

      await Promise.all([
        dbRefresh(pool, 'dds_lera', srcRows.lera),
        dbRefresh(pool, 'dds_olga', srcRows.olga)
      ])
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Build params
      //------------------------------------------------------------------------

      let params = [[], [], []];
      range = list.mts + '!B' + START + ':B' + END;

      params[0] = months; //months
      params[1] = await crud.readData(config.sid_2017.fin_state, range); //articles

      params[1].forEach(article => {
        if (!article) {
          article = '';
        }
      });

      resolve('complite!');


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
              if (!params[1][i][0]) {
                dataPlan[m][d].push(0);
              }
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

        let zipValuesDir = [];

        for (let m = 0; m < zipValues.length; m++) {
          zipValuesDir.push([]);

          for (let j = 0; j < zipValues[m][0].length; j++) {
            zipValuesDir[m].push([]);
          }

          for (let d = 0; d < zipValues[m].length; d++) {
            for (let i = 0; i < zipValues[m][d].length; i++) {
              zipValuesDir[m][i] = _.concat(zipValuesDir[m][i], zipValues[m][d][i]);
              zipValuesDir[m][i].push(null);
            }
          }
        }

        //console.log(require('util').inspect(zipValuesDir, { depth: null }));

        if (months.length > 1) {
          for (let m = 0; m < months.length; m++) {
            arrRange.push([]);
            let list = encodeURIComponent(division);
            arrRange[m].push(list + '!'
              + rangeDirections[division][m + 1][0]
              + START + ':'
              + rangeDirections[division][m + 1][1]);
          }
        } else if (months.length == 1) {
            arrRange.push([]);
            let list = encodeURIComponent(division);
            arrRange[0].push(list + '!'
              + rangeDirections[division][months[0]][0]
              + START + ':'
              + rangeDirections[division][months[0]][1]);
        }


        zipValuesDir.forEach((arrValues, m) => {
          arrFuncions.push(crud.updateData(arrValues, config.sid_2017.fin_state, arrRange[m]));
        });

        await Promise.all(arrFuncions)
        //  .then(async (results) => {console.log(results);})
          .catch(console.log);

        // console.log(division);

      } // end divisions

      //console.log('finish');

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      range = 'main!B22';

      let now = new Date();
      now = [
        [formatDate(now)]
      ];

      await crud.updateData(now, config.sid_2017.monit, range)
      //.then(async (result) => {console.log(result);})
        .catch(console.log);

    } // = End start function =

    //resolve('complite!');
  });
}

module.exports = finState;
