'use strict';

const config = require('config');

async function finStateLoan() {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    //const formatDate = require('../libs/format-date');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const loanQuery = require('../models/db_loan-query');
    const abc = require('../libs/abc')();

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      //-------------------------------------------------------------
      // Const and Var
      //-------------------------------------------------------------

      const COL_MONTH = config.fin_state_loan_colMonths;
      const DIRECTIONS = [
        'AMO CRM',
        'Мульти сайт',
        'Домен / Хостинг',
        'Кучма + Заводов',
        'Профи',
      ];
      const STEP = 7;
      let range = '';
      let range1 = '';
      let range2 = '';

      let list = {
        'dds_lera': encodeURIComponent('ДДС_Лера'),
        'loan': encodeURIComponent('Займы')
      };

      let divisions = config.divisions;


      //-------------------------------------------------------------
      // Refresh DDS Lera
      //-------------------------------------------------------------

      range = list.dds_lera + '!A6:AC';

      let dataDDS = await crud.readData(config.ssId.dds, range);

      await dbRefresh(pool, 'dds_lera', dataDDS)
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      //-------------------------------------------------------------
      // Main functional per each month
      //-------------------------------------------------------------

      for (let month in COL_MONTH) {

        let paramsLoan = [[], [], [], [], []];
        let balance = [[], []];
        let indexBalance = [];
        let sum11 = 0;
        let sum12 = 0;
        let sum21 = 0;
        let sum22 = 0;
        let sumLoan = [];
        let sumRefund = [];

        //= Read data from "Loan" =
        //* Need for get actual balance *

        range = list.loan + '!A1:AZ14';

        let dataLoan = await crud.readData(config.sid_2017.fin_state, range);

        //= Build params =

        paramsLoan[0] = month;
        paramsLoan[1].push(dataLoan[4][0], dataLoan[5][0], dataLoan[9][0], dataLoan[10][0]);
        paramsLoan[2] = DIRECTIONS;
        paramsLoan[3] = DIRECTIONS;

        for (let i = 0; i < COL_MONTH[month].length; i++) {
          indexBalance.push((abc.indexOf(COL_MONTH[month][i])) - STEP);
        }

        for (let d = 0; d < indexBalance.length; d++) {
          balance[0].push([]);
          balance[1].push([]);
          for (let l = 4; l < 9; l++) {

            let value;
            dataLoan[l][indexBalance[d]] ? value = dataLoan[l][indexBalance[d]].trim() : value = 0;

            if (value && !(value.includes('-'))) {
              if (value && value[0] == '(' && value[value.length - 1] == ')') {
                value = value.slice(1).slice(0, -1);
                value = '-' + value;
              }
              value = Number(value.replace(/\s/g, ''));
            } else {
              value = 0;
            }

            balance[0][d].push(value);
          }
          for (let l = 9; l < dataLoan.length; l++) {

            let value;
            dataLoan[l][indexBalance[d]] ? value = dataLoan[l][indexBalance[d]].trim() : value = 0;

            if (value && !(value.includes('-'))) {
              if (value && value[0] == '(' && value[value.length - 1] == ')') {
                value = value.slice(1).slice(0, -1);
                value = '-' + value;
              }
              value = Number(value.replace(/\s/g, ''));
            } else {
              value = 0;
            }

            balance[1][d].push(value);
          }
        }

        await Promise.all([
          loanQuery(pool, 'dds_lera', paramsLoan, '1.1'),
          loanQuery(pool, 'dds_lera', paramsLoan, '1.2'),
          loanQuery(pool, 'dds_lera', paramsLoan, '2.1'),
          loanQuery(pool, 'dds_lera', paramsLoan, '2.2'),
        ])
          .then(async ([s11, s12, s21, s22]) => {
            sum11 = s11;
            sum12 = s12;
            sum21 = s21;
            sum22 = s22;
          })
          .catch(console.log);

        for (let i = 0; i < sum11.length; i++) {
          sumLoan.push([]);
          for (let j = 0; j < sum11[i].length; j++) {
            sumLoan[i].push(Number(sum11[i][j][0]) + Number(sum12[i][j][0]) + Number(balance[0][j][i]));
          }
        }

        for (let i = 0; i < sum21.length; i++) {
          sumRefund.push([]);
          for (let j = 0; j < sum21[i].length; j++) {
            sumRefund[i].push(Number(sum21[i][j][0]) + Number(sum22[i][j][0]) + Number(balance[1][j][i]));
          }
        }

        range1 = list.loan + '!' + COL_MONTH[month][0] + '5:' + COL_MONTH[month][COL_MONTH[month].length - 1] + '9';
        range2 = list.loan + '!' + COL_MONTH[month][0] + '10:' + COL_MONTH[month][COL_MONTH[month].length - 1] + '14';

        await Promise.all([
          crud.updateData(sumLoan, config.sid_2017.fin_state, range1),
          crud.updateData(sumRefund, config.sid_2017.fin_state, range2)
        ])
          .then((result) => {console.log(result);})
          .catch(console.log);


      }//end months


      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      // if (mode) {
      //   range = 'sheet1!C15';
      // } else {
      //   range = 'sheet1!B15';
      // }
      //
      // let now = new Date();
      // now = [
      //   [formatDate(now)]
      // ];
      //
      // await crud.updateData(now, config.ssId.monit, range)
      // //.then(async (result) => {console.log(result);})
      //   .catch(console.log);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');
  });
}

module.exports = finStateLoan;
