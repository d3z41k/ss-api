'use strict';

const config = require('config');

async function dds_monSalary() {
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
      const START = 9;
      // const START2 = START + 3;
      // const END = 100;
      // const DIRECTIONS = config.directions.common_cut;
      // const DEC = '(декада)';
      const SIDS = config.sid_2017.dds_mon;

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let dataDDS = {
        'lera': '',
        'olga': ''
      };

      let mon = 'mar';

      list = encodeURIComponent('Табель 2017');
      range = list + '!B2:O80';

      // let dataReport = await crud.readData(config.sid_2017.report, range);
      //
      // // for (let mon in SIDS) {
      // //   if (SIDS[mon]) {
      //
      //     let prepairDataReport = [];
      //
      //     for (let i = 0; i < dataReport.length; i++) {
      //       dataReport[i].splice(1, 1);
      //       dataReport[i].splice(2, 1);
      //       dataReport[i].splice(4, 1);
      //       dataReport[i].splice(5, 1);
      //     }
      //
      //     for (let i = 0; i < dataReport.length; i++) {
      //       prepairDataReport.push([]);
      //       for (let j = 0; j < dataReport[0].length; j++) {
      //         prepairDataReport[i].push([]);
      //       }
      //     }
      //
      //     // temp block - remake it!
      //
      //     for (let i = 0; i < dataReport.length; i++) {
      //       dataReport[i][4] ? prepairDataReport[i][0] = dataReport[i][4] : prepairDataReport[i][0] = '';
      //       dataReport[i][1] ? prepairDataReport[i][1] = dataReport[i][1] : prepairDataReport[i][1] = '';
      //       dataReport[i][0] ? prepairDataReport[i][2] = dataReport[i][0] : prepairDataReport[i][2] = '';
      //       dataReport[i][2] ? prepairDataReport[i][3] = dataReport[i][2] : prepairDataReport[i][3] = '';
      //       dataReport[i][3] ? prepairDataReport[i][4] = dataReport[i][3] : prepairDataReport[i][4] = '';
      //       dataReport[i][5] ? prepairDataReport[i][5] = dataReport[i][5] : prepairDataReport[i][5] = '';
      //       dataReport[i][6] ? prepairDataReport[i][6] = dataReport[i][6] : prepairDataReport[i][6] = '';
      //       dataReport[i][7] ? prepairDataReport[i][7] = dataReport[i][7] : prepairDataReport[i][7] = '';
      //       dataReport[i][8] ? prepairDataReport[i][8] = dataReport[i][8] : prepairDataReport[i][8] = '';
      //       dataReport[i][9] ? prepairDataReport[i][9] = dataReport[i][9] : prepairDataReport[i][9] = '';
      //     }
      //
      //     //console.log(prepairDataReport);
      //
      //     list = encodeURIComponent('ЗП(декада)');
      //     range = list + '!B8:K';
      //
      //     await crud.updateData(prepairDataReport, SIDS[mon], range)
      //       .then(async results => {console.log(results);})
      //       .catch(console.log);

          //--------------------------------------------------------------------

          let dds_plan = [];
          let dds_fact = [];
          let dataPlan;
          let dataFact;

          let plan_fact = config.dds_mon.src_salary['Mar'];

          let colsPlan = {
            'start': plan_fact.mts[0],
            'end': plan_fact.kz[0],
          };

          let colsFact = {
            'start': plan_fact.mts[1],
            'end': plan_fact.kz[1],
          };

          let srcCheck = {
            'plan': '',
            'fact': ''
          };

          list = encodeURIComponent('ФОТ (план)');
          range1 = list + '!' + colsPlan.start + '1:' + colsPlan.end;

          list = encodeURIComponent('ФОТ (факт)');
          range2 = list + '!' + colsFact.start + '1:' + colsFact.end;

          await Promise.all([
            crud.readData(config.sid_2017.fin_model, range1),
            crud.readData(config.sid_2017.salary, range2)
          ])
            .then(async ([plan, fact]) => {
               dataPlan = plan;
               dataFact = fact;
             })
             .catch(console.log);

        //= Get souece check
        srcCheck.plan = dataPlan.splice(1, 1);
        srcCheck.fact = dataFact.splice(0, 1);
        //= Remove useless element
        dataPlan.splice(0, 5);
        dataFact.splice(0, 4);

        list = encodeURIComponent('ЗП(декада)');
        range = list + '!B8:K';

         for (let i = 0; i < dataPlan[0].length; i++) {
           dds_plan.push([]);
           for (let j = 0; j < dataPlan.length; j++) {
             dds_plan[i].push([dataPlan[j][i]]);
           }
         }

         for (let i = 0; i < dataFact[0].length; i++) {
           dds_fact.push([]);
           for (let j = 0; j < dataFact.length; j++) {
             dds_fact[i].push([dataFact[j][i]]);
           }
         }

         let arrRange1 = [];
         let arrRange2 = [];
         let checkRange = [];
         let checkFuncions = [];
         let arrFuncions = [];
         let colsPlanFact = config.dds_mon.salary

         //= Prepare array of Range =
         for (let dir in colsPlanFact){
           arrRange1.push(list + '!' + colsPlanFact[dir][0] + START + ':' + colsPlanFact[dir][0]);
           arrRange2.push(list + '!' + colsPlanFact[dir][1] + START + ':' + colsPlanFact[dir][1]);
           checkRange.push(list + '!' + colsPlanFact[dir][0] + '3:' + colsPlanFact[dir][1] + '3');
         }

         let dstCheck = {
           'plan': [],
           'fact': []
         };

         for (let i = 0; i < checkRange.length; i++) {
           let dataTemp = await crud.readData(SIDS[mon], checkRange[i]);
           dstCheck.plan.push(dataTemp[0][0]);
           dstCheck.fact.push(dataTemp[0][1])
         }

         console.log(srcCheck);
         console.log(dstCheck);

        //= Prepare array of Functions =
        dds_plan.forEach((arrValues, i) => {
          arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange1[i]));
        });

        dds_fact.forEach((arrValues, i) => {
          arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange2[i]));
        });

        // //= Update data =
        // await Promise.all(arrFuncions)
        //   .then(async (results) => {console.log(results);})
        //   .catch(console.log);



      //     //-------------------------------------------------------------
      //     // Read data from dds_lera to RAM
      //     //-------------------------------------------------------------
      //
      //     list = encodeURIComponent('ДДС_Лера');
      //     range1 = list + '!A6:V';
      //
      //     list = encodeURIComponent('ДДС_Ольга');
      //     range2 = list + '!A6:AD';
      //
      //     await Promise.all([
      //       crud.readData(config.sid_2017.dds, range1),
      //       crud.readData(config.sid_2017.dds, range2)
      //     ])
      //      .then(async ([dds_lera, dds_olga]) => {
      //         dataDDS.lera = dds_lera;
      //         dataDDS.olga = dds_olga;
      //       })
      //       .catch(console.log);
      //
      //     //---------------------------------------------------------------
      //     // Refresh table
      //     //---------------------------------------------------------------
      //
      //     await Promise.all([
      //       dbRefresh(pool, 'dds_lera', dataDDS.lera),
      //       dbRefresh(pool, 'dds_olga', dataDDS.olga)
      //     ])
      //       //.then(async (results) => {console.log(results);})
      //       .catch(console.log);
      //
      //     //------------------------------------------------------------------------
      //     // Build paramsMonDDS and get & update
      //     //------------------------------------------------------------------------
      //
      //     let paramsMonDDS = [[], [], [], []];
      //     let commonValues = [];
      //     let decValuses = [];
      //     let sum1;
      //     let sum2;
      //
      //     try {
      //
      //       for (let d = 0; d < DIRECTIONS.length; d++) {
      //
      //         //= Clear =
      //         paramsMonDDS = [[], [], []];
      //         commonValues = [];
      //         decValuses = [];
      //         sum1 = [];
      //         sum2 = [];
      //         let mode = 1;
      //
      //         //= Get data from 'DDS_Mon' =
      //         list = encodeURIComponent(DIRECTIONS[d] + DEC);
      //         range = list + '!B1:C' + END;
      //         let monDDS = await crud.readData(SIDS[mon], range);
      //
      //         //= Build params =
      //         paramsMonDDS[0].push(monDDS[3][0].slice(2));
      //         paramsMonDDS[1].push(monDDS[1][1].trim());
      //         paramsMonDDS[3] = ['1', '2', '3'];
      //
      //
      //         for (let a = (START - 1); a < monDDS.length; a++) {
      //           if (monDDS[a][0] && monDDS[a][0][0] != '→') {
      //             paramsMonDDS[2].push(monDDS[a][0].trim());
      //           } else {
      //             paramsMonDDS[2].push(' ');
      //           }
      //         }
      //
      //         //= Get values =
      //         await Promise.all([
      //           dds_monQuery(pool, 'dds_lera', paramsMonDDS, mode),
      //           dds_monQuery(pool, 'dds_olga', paramsMonDDS, mode)
      //         ])
      //           .then(async ([s1, s2]) => {
      //             sum1 = s1;
      //             sum2 = s2;
      //           })
      //           .catch(console.log);
      //
      //
      //         for (let d = 0; d < sum1.length; d++) {
      //           decValuses.push([]);
      //           for (let i = 0; i < sum1[d].length; i++) {
      //             decValuses[d].push([Number(sum1[d][i]) + Number(sum2[d][i])]);
      //           }
      //         }
      //
      //         //= Cut values =
      //         decValuses[0].splice(0, 3);
      //         decValuses[1].splice(0, 3);
      //         decValuses[2].splice(0, 3);
      //
      //         range = list + '!E' + START2 + ':E' + END;
      //         range1 = list + '!H' + START2 + ':H' + END;
      //         range2 = list + '!K' + START2 + ':K' + END;
      //
      //         await Promise.all([
      //           crud.updateData(decValuses[0], SIDS[mon], range),
      //           crud.updateData(decValuses[1], SIDS[mon], range1),
      //           crud.updateData(decValuses[2], SIDS[mon], range2)
      //
      //         ])
      //         //  .then(async results => {console.log(results);})
      //           .catch(console.log);
      //
      //         //----------------------------------------------------------------
      //         // Update Common values
      //         //----------------------------------------------------------------
      //
      //         mode = 0;
      //
      //         await Promise.all([
      //           dds_monQuery(pool, 'dds_lera', paramsMonDDS, mode),
      //           dds_monQuery(pool, 'dds_olga', paramsMonDDS, mode)
      //         ])
      //           .then(async ([s1, s2]) => {
      //             sum1 = s1;
      //             sum2 = s2;
      //           })
      //           .catch(console.log);
      //
      //         for (let i = 0; i < sum1.length; i++) {
      //           commonValues.push([Number(sum1[i]) + Number(sum2[i])]);
      //         }
      //
      //         //= Update data =
      //         range = list + '!N' + START + ':N' + END;
      //
      //         await crud.updateData(commonValues, SIDS[mon], range)
      //         //  .then(async results => {console.log(results);})
      //           .catch(console.log);
      //
      //         await sleep(1000);
      //       }// end direcions loop
      //
      //     } catch (e) {
      //       reject(e.stack);
      //     }
      //
      //     // //------------------------------------------------------------------------
      //     // // Update date-time in "Monitoring"
      //     // //------------------------------------------------------------------------
      //     //
      //     // // range = 'main!B9';
      //     // //
      //     // // let now = new Date();
      //     // // now = [[formatDate(now)]];
      //     // //
      //     // // await crud.updateData(now, config.sid_2017.monit, range);
      //
    //  } //endif mon
    //     await sleep(1000);
    //} // end SIDS loop

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = dds_monSalary;
