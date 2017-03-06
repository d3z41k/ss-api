'use strict';

const config = require('config');

async function dds_monSalary(mon) {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normalizeMinus = require('../libs/normalize-minus');
    //const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const dds_salaryQuery = require('../models/db_dds-salary-query');

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


      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let dataDDS = {
        'lera': '',
        'olga': ''
      };

      list = encodeURIComponent('Табель 2017');
      range = list + '!B2:O80';

      let dataReport = await crud.readData(config.sid_2017.report, range);
      let prepairDataReport = [];

      try {

        for (let i = 0; i < dataReport.length; i++) {
          dataReport[i].splice(1, 1);
          dataReport[i].splice(2, 1);
          dataReport[i].splice(4, 1);
          dataReport[i].splice(5, 1);
        }

        for (let i = 0; i < dataReport.length; i++) {
          prepairDataReport.push([]);
          for (let j = 0; j < dataReport[0].length; j++) {
            prepairDataReport[i].push([]);
          }
        }

        // temp block - remake it!

        for (let i = 0; i < dataReport.length; i++) {
          dataReport[i][4] ? prepairDataReport[i][0] = dataReport[i][4] : prepairDataReport[i][0] = '';
          dataReport[i][1] ? prepairDataReport[i][1] = dataReport[i][1] : prepairDataReport[i][1] = '';
          dataReport[i][0] ? prepairDataReport[i][2] = dataReport[i][0] : prepairDataReport[i][2] = '';
          dataReport[i][2] ? prepairDataReport[i][3] = dataReport[i][2] : prepairDataReport[i][3] = '';
          dataReport[i][3] ? prepairDataReport[i][4] = dataReport[i][3] : prepairDataReport[i][4] = '';
          dataReport[i][5] ? prepairDataReport[i][5] = dataReport[i][5] : prepairDataReport[i][5] = '';
          dataReport[i][6] ? prepairDataReport[i][6] = dataReport[i][6] : prepairDataReport[i][6] = '';
          dataReport[i][7] ? prepairDataReport[i][7] = dataReport[i][7] : prepairDataReport[i][7] = '';
          dataReport[i][8] ? prepairDataReport[i][8] = dataReport[i][8] : prepairDataReport[i][8] = '';
          dataReport[i][9] ? prepairDataReport[i][9] = dataReport[i][9] : prepairDataReport[i][9] = '';
        }

      } catch (e) {
        reject(e.stack);
      }

      list = encodeURIComponent('ЗП(декада)');
      range = list + '!B8:K';

      //= Update data =
      await crud.updateData(prepairDataReport, SIDS[mon], range)
      //  .then(async results => {console.log(results);})
        .catch(console.log);

      //--------------------------------------------------------------------

      let dds_plan = [];
      let dds_fact = [];
      let dataPlan;
      let dataFact;

      let plan_fact = config.dds_mon.src_salary[mon];

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
      srcCheck.plan = srcCheck.plan[0];
      srcCheck.fact = srcCheck.fact[0];
      //= Remove useless element
      dataPlan.splice(0, 5);
      dataFact.splice(0, 4);

      // range = list + '!B8:K';

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

       let arrRange1 = [];
       let arrRange2 = [];
       let arrRange3 = [];
       let checkRange = [];
       let arrCheck = [];
       let checkFuncions = [];
       let arrFuncions = [];
       let colsPlanFact = config.dds_mon.salary

       list = encodeURIComponent('ЗП(декада)');

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
        .then(async (results) => {console.log(results);})
        .catch(console.log);

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

      //--------------------------------------------------------------------
      // Refresh table
      //--------------------------------------------------------------------

      await Promise.all([
        dbRefresh(pool, 'dds_lera', dataDDS.lera),
        dbRefresh(pool, 'dds_olga', dataDDS.olga)
      ])
        //.then(async (results) => {console.log(results);})
        .catch(console.log);

      //--------------------------------------------------------------------
      // Build paramsSalaryDDS and get & update
      //--------------------------------------------------------------------

      let paramsSalaryDDS  = [[], [], [], []];
      let sum1;
      let sum2;

      list = encodeURIComponent('ЗП(декада)');
      range = list + '!B9:D';

      let dataSalaryDDS = await crud.readData(SIDS[mon], range);

      //= Build params =
      for (let i = 0; i < dataSalaryDDS.length; i++) {
        if (dataSalaryDDS[i][0] && dataSalaryDDS[i][2]) {
          paramsSalaryDDS[0].push(dataSalaryDDS[i][2].trim()); //name
          paramsSalaryDDS[1].push(dataSalaryDDS[i][0].trim()); //departion
        } else {
          paramsSalaryDDS[0].push(' ');
          paramsSalaryDDS[1].push(' ');
        }
      }

      paramsSalaryDDS[2] = MONTHS[mon]; //current month
      paramsSalaryDDS[3] = DIRECTIONS; //directions
      paramsSalaryDDS[4] = DECS; //decade

      await Promise.all([
        dds_salaryQuery(pool, 'dds_lera', paramsSalaryDDS),
        dds_salaryQuery(pool, 'dds_olga', paramsSalaryDDS)
      ])
        .then(async ([s1, s2]) => {
          sum1 = s1;
          sum2 = s2;
        })
        .catch(console.log);

      let sumSalary = [];

      for (let dec = 0; dec < sum1.length; dec++) {
        sumSalary.push([]);
        for (let i = 0; i < sum1[dec].length; i++) {
          sumSalary[dec].push([]);
          for (let j = 0; j < sum1[dec][i].length; j++) {
            sumSalary[dec][i].push(
              [Number(sum1[dec][i][j]) + Number(sum2[dec][i][j])]
            );
          }
        }
      }

      //console.log(require('util').inspect(sumSalary, { depth: null }));
      let colsDecSalary = config.dds_mon.salary;

      arrRange1 = [];
      arrRange2 = [];
      arrRange3 = [];
      arrFuncions = [];

      for (let dir in colsDecSalary) {
        arrRange1.push(list + '!' + colsDecSalary[dir][2] + START + ':' + colsDecSalary[dir][2]);
        arrRange2.push(list + '!' + colsDecSalary[dir][3] + START + ':' + colsDecSalary[dir][3]);
        arrRange3.push(list + '!' + colsDecSalary[dir][4] + START + ':' + colsDecSalary[dir][4]);
      }

      sumSalary[0].forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange1[i]));
      });

      sumSalary[1].forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange2[i]));
      });

      sumSalary[2].forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, SIDS[mon], arrRange3[i]));
      });

      //= Update DDS Salary =
      await Promise.all(arrFuncions)
      //  .then(async (results) => {console.log(results);})
        .catch(console.log);

    //----------------------------------------------------------------------
    // Update date-time in "Monitoring"
    //----------------------------------------------------------------------

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

module.exports = dds_monSalary;
