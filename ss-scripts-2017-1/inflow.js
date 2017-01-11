'use strict';

const config = require('config');

async function inflow(month) {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models/db_pool');
    const inflowQuery = require('../models/db_inflow-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const COLS = config.inflow_col_2017;
      const RU_MONTHS = config.inflow_months_2017;

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
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

      //-------------------------------------------------------------
      // Get data from fin_model
      //-------------------------------------------------------------

      list = encodeURIComponent('Приходы (план)');
      range1 = list + '!A2:I66';

      list = encodeURIComponent('Прогнозы');
      range2 = list + '!A3:U67';

      let parishes;
      let forecast;

      await Promise.all([
        crud.readData(config.sid_2017.fin_model, range1),
        crud.readData(config.sid_2017.fin_model, range2)
      ]).then(async ([par, forc]) => {
          parishes = par;
          forecast = forc;
        })
        .catch(console.log);

      //-------------------------------------------------------------
      // Get data from inflow
      //-------------------------------------------------------------

      let numMonth = RU_MONTHS[month][0];
      list = encodeURIComponent(RU_MONTHS[month][1]);
      range = list + '!B1:T95';

      let inflow = await crud.readData(config.sid_2017.inflow, range);

      //= Build params and get values for parishes & forecast =

      let values = {
        '→ Мульти сайт': {'1': [], '2': [], '3': [], 'check': [], 'range': [7, 21]},
        '→ Профи': {'1': [], '2': [], '3': [], 'check': [], 'range': [27, 32]},
        '→ AMO CRM': {'1': [], '2': [], '3': [], 'check': [], 'range': [38, 55]},
        '→ Домен / Хостинг': {'1': [], '2': [], '3': [], 'check': [], 'range': [61, 66]},
        '→ Кучма + Заводов': {'1': [], '2': [], '3': [], 'check': [], 'range': [72, 74]}
      };

      for (let i = 0; i < inflow.length; i++) {
        for (let j = 0; j < parishes.length; j++) {
            if (inflow[i][0]
              && inflow[i][1].trim() == parishes[j][1]
              && inflow[i][2].trim() == parishes[j][2]
            ) {
              parishes[j][parishes[0].indexOf(String(numMonth + 1))]
                ? values[inflow[i][0]]['check'].push([parishes[j][parishes[0].indexOf(String(numMonth + 1))]])
                : values[inflow[i][0]]['check'].push(['']);
            }
            if (inflow[i][0]
              && inflow[i][1].trim() == forecast[j][1]
              && inflow[i][2].trim() == forecast[j][2]
            ) {
              for (let d = 0; d < 3; d++) {
                forecast[j][forecast[0].indexOf(String(numMonth + 1)) + d]
                  ? values[inflow[i][0]][d + 1].push([forecast[j][forecast[0].indexOf(String(numMonth + 1)) + d]])
                  : values[inflow[i][0]][d + 1].push(['']);
              }
            }
        }
      }

      for (let division in values) {

        //= Build params for query =
        let inflowParams = [[], [], [], [], []];

        inflowParams[0] = inflow[0][1];
        inflowParams[1] = [1, 2, 3];
        inflowParams[2] = inflow[values[division].range[0]][0];

        for (let r = values[division].range[0] - 1; r < values[division].range[1]; r++) {
          inflowParams[3].push(inflow[r][1]);
          inflowParams[4].push(inflow[r][2]);
        }

        let sum1;
        let sum2;
        await Promise.all([
          inflowQuery(pool, 'dds_lera', inflowParams),
          inflowQuery(pool, 'dds_olga', inflowParams)
        ])
          .then(async ([s1, s2]) => {
            sum1 = s1;
            sum2 = s2;
          })
          .catch(console.log);

        let sum = [];

        for (let i = 0; i < sum1.length; i++) {
          sum.push([]);
          for (let j = 0; j < sum1[i].length; j++) {
            sum[i].push([Number(sum1[i][j][0]) + Number(sum2[i][j][0])]);
          }
        }

        for (let d = 1; d < 4; d++) {

          await Promise.all([
            crud.updateData(values[division][d], config.sid_2017.inflow,
              list + '!' + COLS[d][0] + values[division].range[0] + ':' + COLS[d][0] + values[division].range[1]),
            crud.updateData(sum[d - 1], config.sid_2017.inflow,
              list + '!' + COLS[d][1] + values[division].range[0] + ':' + COLS[d][1] + values[division].range[1])
          ])
            .then(async results => {console.log(results);})
            .catch(console.log);

        }

        await crud.updateData(values[division]['check'], config.sid_2017.inflow,
        list + '!' + COLS['check'] + values[division].range[0] + ':' + COLS['check'] + values[division].range[1])
          .then(async results => {console.log(results);})
          .catch(console.log);

      } //division


      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      range = 'main!C19';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = inflow;
