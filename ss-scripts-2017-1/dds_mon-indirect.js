'use strict';

const config = require('config');

async function dds_monIndirect(mon) {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normalizeMinus = require('../libs/normalize-minus');
    const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const dds_indirectQuery = require('../models/db_dds-indirect-query');

    //-------------------------------------------------------------------------
    // Main function
    //-------------------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      const SIDS = config.sid_2017.dds_mon;
      const START = 9;
      const MONTHS = config.months;
      const DECS = [1, 2, 3];
      const DIRECTIONS = config.directions.common;


      var list = '';
      var range = '';
      let range1 = '';
      let range2 = '';
      let dataDDS = {
        'lera': '',
        'olga': ''
      };

     let arrRange1 = [];
     let arrRange2 = [];
     let arrRange3 = [];
     let checkRange = [];
     let arrCheck = [];
     let checkFuncions = [];
     let arrFuncions = [];
     let colsPlanFact = config.dds_mon.indirect

      list = encodeURIComponent('Спр');
      range = list + '!J2:J100';

      let dataManDDS = await crud.readData(config.sid_2017.dds, range);

      range = list + '!A1:A';

      //= Update data =
      await crud.updateData(dataManDDS, SIDS[mon], range)
      //  .then(async results => {console.log(results);})
        .catch(console.log);

      //--------------------------------------------------------------------

      let dds_plan = [];
      let dds_fact = [];
      let dataPlan;
      let dataFact;

      let plan_fact = config.dds_mon.src_indirect[mon];

      let colsPlan = {
        'start': plan_fact.mts,
        'end': plan_fact.kz,
      };

      let colsFact = {
        'start': plan_fact.mts,
        'end': plan_fact.kz,
      };

      let srcCheck = {
        'plan': '',
        'fact': ''
      };

      list = encodeURIComponent('Косвенные (план)');
      range1 = list + '!' + colsPlan.start + '1:' + colsPlan.end;

      list = encodeURIComponent('Косвенные (факт)');
      range2 = list + '!' + colsFact.start + '1:' + colsFact.end;

      await Promise.all([
        crud.readData(config.sid_2017.fin_model, range1),
        crud.readData(config.sid_2017.indirect, range2)
      ])
        .then(async ([plan, fact]) => {
           dataPlan = plan;
           dataFact = fact;
         })
         .catch(console.log);

      //= Get souece check
      srcCheck.plan = dataPlan.splice(1, 1);
      srcCheck.fact = dataFact.splice(0, 1);
      srcCheck.plan = srcCheck.plan[0];
      srcCheck.fact = srcCheck.fact[0];
      //= Remove useless element
      dataPlan.splice(0, 5);
      dataFact.splice(0, 5);

       for (let i = 0; i < dataPlan[0].length; i++) {
         dds_plan.push([]);
         for (let j = 0; j < dataPlan.length; j++) {
           dds_plan[i].push([
             dataPlan[j][i] && dataPlan[j][i].trim() != '-' ? dataPlan[j][i].trim() : 0
           ]);
         }
       }

       for (let i = 0; i < dataFact[0].length; i++) {
         dds_fact.push([]);
         for (let j = 0; j < dataFact.length; j++) {
           dds_fact[i].push([
             dataFact[j][i] && dataFact[j][i].trim() != '-' ? dataFact[j][i].trim() : 0
           ]);
         }
       }


       list = encodeURIComponent('Косвенные расходы(декада)');

       //= Prepare array of Range =
      for (let dir in colsPlanFact){
        arrRange1.push(list + '!' + colsPlanFact[dir][0] + START + ':' + colsPlanFact[dir][0]);
        arrRange2.push(list + '!' + colsPlanFact[dir][1] + START + ':' + colsPlanFact[dir][1]);
        checkRange.push(list + '!' + colsPlanFact[dir][0] + '3:' + colsPlanFact[dir][1] + '3');
      }

      //= Prepare array of Functions =
      dds_plan.forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange1[i]));
      });

      dds_fact.forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange2[i]));
      });

      //= Update data =
      await Promise.all(arrFuncions)
      //  .then(async (results) => {console.log(results);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Check Get & Update
      //------------------------------------------------------------------------

      let dstCheck = {
        'plan': [],
        'fact': []
      };

      let resultCheck = {
        'plan': [],
        'fact': []
      };

      for (let i = 0; i < checkRange.length; i++) {
        let dataTemp = await crud.readData(SIDS[mon], checkRange[i]);
        dstCheck.plan.push(dataTemp[0][0]);
        dstCheck.fact.push(dataTemp[0][1]);
      }

      for (let val in srcCheck) {
        for (let i = 0; i < srcCheck[val].length; i++) {
           srcCheck[val][i] = normalizeMinus(srcCheck[val][i]);
           dstCheck[val][i] = normalizeMinus(dstCheck[val][i]);

           resultCheck[val].push(srcCheck[val][i] - dstCheck[val][i]);
        }
      }

      for (let i = 0; i < resultCheck.plan.length; i++) {
        arrCheck.push([resultCheck.plan[i], resultCheck.fact[i]]);
      }

      checkRange = [];

      for (let dir in colsPlanFact){
        checkRange.push(list + '!' + colsPlanFact[dir][0] + '2:' + colsPlanFact[dir][1]);
      }

      arrCheck.forEach((arrValues, i) => {
        checkFuncions.push(crud.updateData([arrValues], SIDS[mon], checkRange[i]));
      });

      //= Check =
      await Promise.all(checkFuncions)
      //  .then(async (results) => {console.log(results);})
        .catch(console.log);

      //-------------------------------------------------------------
      //Read data from dds_lera to RAM
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

      //--------------------------------------------------------------------
      // Refresh table
      //--------------------------------------------------------------------

      await Promise.all([
        dbRefresh(pool, 'dds_lera', dataDDS.lera),
        dbRefresh(pool, 'dds_olga', dataDDS.olga)
      ])
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      //--------------------------------------------------------------------
      // Build paramsSalaryDDS and get & update
      //--------------------------------------------------------------------

      let paramsIndirectDDS  = {
        '2.1' : [[], [], [], [], []],
        '2.2' : [[], [], [], [], []],
        '2.3' : [[], [], [], [], []],
        '2.4' : [[], [], [], [], []],

      };

      for (let key in paramsIndirectDDS) {
        paramsIndirectDDS[key][0].push(MONTHS[mon]); //current month
        paramsIndirectDDS[key][3] = DIRECTIONS; //directions
        paramsIndirectDDS[key][4] = DECS; //decade
      }

      list = encodeURIComponent('Косвенные расходы(декада)');
      range = list + '!B9:D';
      let dataIndirectDDS = await crud.readData(SIDS[mon], range);

      for (let i = 0; i < dataIndirectDDS.length; i++) {
        for (let key in paramsIndirectDDS) {
          paramsIndirectDDS[key][1].push(dataIndirectDDS[i][0]); //articles
        }
        paramsIndirectDDS['2.2'][2].push(
          dataIndirectDDS[i][2] ? dataIndirectDDS[i][2] : ' '
        ); //transcript
        paramsIndirectDDS['2.3'][2].push(
          dataIndirectDDS[i][1] ? dataIndirectDDS[i][1] : ' '
        ); //company
      }

      let sumDirectionsCommon = [];

      // Crutch !!!
      let taxes = ['НДФЛ', 'Взносы за сотрудников', 'Взносы ИП', 'УСН', 'Транспортный налог'];

      for (let mode in paramsIndirectDDS) {

        let sum1;
        let sum2;
        let sumDirections = [];
        let start = 0;
        let end = 0;

        await Promise.all([
          dds_indirectQuery(pool, 'dds_lera', paramsIndirectDDS, mode, taxes),
          dds_indirectQuery(pool, 'dds_olga', paramsIndirectDDS, mode, taxes)
        ])
          .then(async ([s1, s2]) => {
            sum1 = s1;
            sum2 = s2;
          })
          .catch(console.log);

          //console.log(sum1);

          for (let dec = 0; dec < sum1.length; dec++) {

            sumDirections.push([]);
            for (let d = 0; d < sum1[dec].length; d++) {
              sumDirections[dec].push([]);
              for (let i = 0; i < sum1[dec][d].length; i++) {
                sumDirections[dec][d].push(Number(sum1[dec][d][i]) + Number(sum2[dec][d][i]));
              }
            }
          }

          //= Concat types in Common sum

          for (let dec = 0; dec < sumDirections.length; dec++) {
            sumDirectionsCommon[dec] ? null : sumDirectionsCommon.push([]);
            for (let d = 0; d < sumDirections[dec].length; d++) {
              sumDirectionsCommon[dec][d] ? null : sumDirectionsCommon[dec].push([]);
              for (let i = 0; i < sumDirections[dec][d].length; i++) {
                if (sumDirectionsCommon[dec][d][i] || sumDirectionsCommon[dec][d][i] === 0) {
                  sumDirectionsCommon[dec][d][i] += sumDirections[dec][d][i];
                } else {
                  sumDirectionsCommon[dec][d][i] = 0;
                }
              }
            }
          }

      } // End mode

      for (let dec = 0; dec < sumDirectionsCommon.length; dec++) {
        for (let d = 0; d < sumDirectionsCommon[dec].length; d++) {
            for (let i = 0; i < sumDirectionsCommon[dec][d].length; i++) {
              sumDirectionsCommon[dec][d][i] = [sumDirectionsCommon[dec][d][i]];
            }
        }
      }

      let colsDecIndirect = config.dds_mon.indirect;

      arrRange1 = [];
      arrRange2 = [];
      arrRange3 = [];
      arrFuncions = [];

      list = encodeURIComponent('Косвенные расходы(декада)');

      console.log(sumDirectionsCommon.length);

      for (let dir in colsDecIndirect) {
        arrRange1.push(list + '!' + colsDecIndirect[dir][2] + START + ':' + colsDecIndirect[dir][2]);
        arrRange2.push(list + '!' + colsDecIndirect[dir][3] + START + ':' + colsDecIndirect[dir][3]);
        arrRange3.push(list + '!' + colsDecIndirect[dir][4] + START + ':' + colsDecIndirect[dir][4]);
      }

      sumDirectionsCommon[0].forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange1[i]));
      });

      sumDirectionsCommon[1].forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange2[i]));
      });

      sumDirectionsCommon[2].forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange3[i]));
      });

      // = Update DDS Indirect =
      await Promise.all(arrFuncions)
        .then(async (results) => {console.log(results);})
        .catch(console.log);

    //----------------------------------------------------------------------
    // Update date-time in "Monitoring"
    //----------------------------------------------------------------------

    let monRange;

    switch (mon[0]) {
      case 'Jan':
        monRange = 'main!B24';
        break;
      case 'Feb':
        monRange = 'main!B25';
        break;
      case 'Mar':
        monRange = 'main!B26';
        break;
      case 'Apr':
        monRange = 'main!B27';
        break;
      case 'May':
        monRange = 'main!B28';
        break;
      case 'Jun':
        monRange = 'main!B29';
        break;
    }

    let now = new Date();
    now = [[formatDate(now)]];

    await crud.updateData(now, config.sid_2017.monit, monRange);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = dds_monIndirect;
