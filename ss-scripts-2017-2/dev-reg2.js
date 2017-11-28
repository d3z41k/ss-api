'use strict';

const config = require('config');
const _ = require('lodash/array');

//------------------------------------------------------------------------------
// Main function
//------------------------------------------------------------------------------

async function devReg() {
  return new Promise(async (resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const formatNumber = require('../libs/format-number');
    const normLength = require('../libs/normalize-length');
    const normType = require('../libs/normalize-type');
    const dbRefresh = require('../models-2017-2/db_refresh');
    const pool = require('../models-2017-2/db_pool');
    const devRegQuery = require('../models-2017-2/db_dev-reg-query');
    const devRegAddQuery = require('../models-2017-2/db_dev-reg-add-query');
    const getPlanHours = require('./libs/dev-reg/getPlanHours');
    const getRatioHours = require('./libs/dev-reg/getRatioHours2');

    let abc = require('../libs/abc')();

    async function start(auth) {

      const crud = new Crud(auth);

      const CREW = 15;
      const START = 6;
      const YEAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const MONTHS = YEAR.slice(7); // change half-year

      let list = {
        'development': encodeURIComponent('Разработка (реестр) (юра)'),
        'clients': encodeURIComponent('Клиенты (разработка)'),
        'fot': encodeURIComponent('ФОТ (факт)'),
        'dds_olga': encodeURIComponent('ДДС_Ольга'),
        'name': ''
      };
      let range = '';
      let range1 = '';
      let range2 = '';

      //= Get months cols for develope registryData =
      const COL_MONTH = config.reg_ratioHours_2;
      const COL_ADD_COSTS = config.addCosts_2_new;

      let values;
      let zipValues = [];
      let arrRange = [];
      let arrFuncions = [];

      //------------------------------------------------------------------------
      // Get Project length (Build xArray)
      //------------------------------------------------------------------------

      range = list.development + '!A1:A';
      let xLable = await crud.readData(config.sid_2017_2.dev, range);

      let xArray = [];

      xLable.forEach((value, x) => {
        if (value == 'x') {
          xArray.push(x + 2);
        }
      });

      xArray.pop();
      xArray.unshift(START);

      //------------------------------------------------------------------------
      // Get data from 'registryData'
      //------------------------------------------------------------------------

      range = list.development + '!C6:DI' + xLable.length;
      let registryData = await crud.readData(config.sid_2017_2.dev, range);

      //------------------------------------------------------------------------
      // Build params for planHours
      //------------------------------------------------------------------------

      let paramsHours = [[], []];
      let flag = true;

      try {

        for (let x = 0; x < xArray.length; x++) {
          paramsHours[0].push(registryData[xArray[x] - START][4]);
          if (flag) {
            for (let c = (xArray[x] - START); c < (xArray[x] - START + CREW); c++) {
                paramsHours[1].push(registryData[c][6]);
            }
          }
          flag = false;
        }

      } catch (e) {
        reject(e.stack);
      }

      /*************************************************************************
       *** Part 2 - Contract sum and Action months
       ************************************************************************/

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      range = list.clients + '!A6:U';
      let clientData = await crud.readData(config.sid_2017_2.dev, range);

      let contractSum = clientData.map(row => {
          return [
            row[0],
            row[9] && Number(row[9].replace(/\s/g, ''))
            ? Number(row[9].replace(/\s/g, '')) : 0
          ];
      });

      //------------------------------------------------------------------------
      // Get "Action & Contract months"
      //------------------------------------------------------------------------

      let actionMonth = [];
      let actionMonths = [];
      let contractMonths = [];
      let cutActionMonths = [];
      let cutContractMonths = [];

      try {

         for (let x = 0; x < xArray.length; x++) {
           actionMonth.push([]);
           for (let i = 0; i < clientData.length; i++) {
             if (registryData[xArray[x] - START][0]  == clientData[i][0]) {

               //= Push start month =
               if (clientData[i][6]
                 && clientData[i][6].slice(6) == '2016') {
                 actionMonth[x].push(7);
               } else {
                 actionMonth[x].push(clientData[i][6] && clientData[i][6].slice(3, 5) >= 7
                   ? Number(clientData[i][6].slice(3, 5)) : 7);
               }
               //= Push end month =
               if (clientData[i][10]
                 && (clientData[i][10].slice(6) == '2016' || clientData[i][10].slice(3, 5) < 7)) {
                 actionMonth[x].push(0);
               } else {
                 actionMonth[x].push(clientData[i][10] && clientData[i][10].slice(3, 5) >= 7
                    ? Number(clientData[i][10].slice(3, 5)) : 12);
               }
             }
           }
            actionMonth[x].length = 2;
          }

          //= Get Actual months for a projects =
          actionMonth.forEach(months => {
              if (!months[1]) {
                contractMonths.push([0]);
              } else {
                contractMonths.push(YEAR.slice(months[0], months[1] + 1));
              }
              actionMonths.push(YEAR.slice(months[0]));
          });

          //console.log(contractMonths);

          //= Сut Action months for a projects =
          actionMonths.forEach(months => {
            let line = months.filter(month => {
              return month >= 7;
            });
            cutActionMonths.push(line);
          });

          //= Get Contract months for a projects =
          contractMonths.forEach(months => {
            let line = months.filter(month => {
              return month >= 7;
            });
            cutContractMonths.push(line);
          });

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Get & Insert mounth and amount of the act
      //------------------------------------------------------------------------

      let monthAct = clientData.map(row => {
        return [
          row[0], row[10] ? row[10] : 0,
          row[9] && Number(row[9].replace(/\s/g, ''))
          ? Number(row[9].replace(/\s/g, '')) : 0
        ];
      });

      let colsAct = config.reg_colsAct_1;

      let endMonths = [];
      let endActs = [];

      for (let x = 0; x < xArray.length; x++) {

        let month = 0;

        for (let i = 0; i < monthAct.length; i++) {
          if (registryData[xArray[x] - START][0]  == monthAct[i][0]) {
            if (monthAct[i][1]
              && (monthAct[i][1].slice(6) == '2016' || monthAct[i][1].slice(3, 5) < 7)) {
              month = 0;
            } else {
              month = monthAct[i][1] ? Number(monthAct[i][1].substr(3, 2)) : '';
            }

            endMonths.push([month]);
            for (let c = 0; c < CREW; c++) {
              endMonths.push([]);
            }

            if (colsAct[month]) {
              arrRange.push(list.development + '!' + colsAct[month] + xArray[x]);
              endActs.push([[monthAct[i][2]]]);
            }

          }
        }

      }


      //= Prepare array of Functions =
      endActs.forEach((endAct, i)=> {
        arrFuncions.push(crud.updateData(endAct, config.sid_2017_2.dev, arrRange[i]));
      });

    //= Update data =
    //  await Promise.all(arrFuncions)
    //  //  .then(async (results) => {console.log(results);})
    //     .catch(console.log);

      range = list.development + '!F' + START + ':F';

      await crud.updateData(endMonths, config.sid_2017_2.dev, range)
      //  .then(async result => {console.log(result);})
        .catch(console.err);

      console.log('* Get & Insert mounth and amount of the act *');

      /*************************************************************************
       *** Part 4 - Additional costs (licences, freelance)
       ************************************************************************/

      //------------------------------------------------------------------------
      // Build params & update of additional costs
      //------------------------------------------------------------------------

      try {

        let addCostsParams = [[], [[],[],[]], [], []];

        addCostsParams[0] = [7, 8, 9, 10, 11, 12]; //months
        addCostsParams[1][0] = 'Фриланс (верстальщик)'; //article
        addCostsParams[1][1] = 'Фриланс (интегратор)'; //article
        addCostsParams[1][2] = 'Фриланс (дизайнер)'; //article
        addCostsParams[1][3] = 'Фриланс (программист)'; //article
        addCostsParams[1][4] = 'Лицензия ЮМИ'; //article
        addCostsParams[1][5] = 'Лицензия Битрикс'; //article

        for (let x = 0; x < xArray.length; x++) {
          addCostsParams[2].push(registryData[xArray[x] - START][0]); //site
          addCostsParams[3].push(registryData[xArray[x] - START][1]); //counterparty
        }

        values = await devRegAddQuery(pool, 'dds_olga', addCostsParams, CREW);

        zipValues = [];
        arrRange = [];
        arrFuncions = [];

        //= Zip valuses =
        values.forEach(val => {
          let arrArticles = [];
          for (let a = 0; a < val.length; a++) {
            arrArticles.push(val[a]);
          }

          // !! Hardcode 6 params, months (a half-year)
          zipValues.push(_.zip(
            arrArticles[0],
            arrArticles[1],
            arrArticles[2],
            arrArticles[3],
            arrArticles[4],
            arrArticles[5]
          ));
        });

        //= Prepare array of Range =
        for (let month in COL_ADD_COSTS){
          arrRange.push(list.development + '!' + COL_ADD_COSTS[month][0] + START + ':' + COL_ADD_COSTS[month][1]);
        }

        //= Prepare array of Functions =
        zipValues.forEach((arrValues, i)=> {
          arrFuncions.push(crud.updateData(arrValues, config.sid_2017_2.dev, arrRange[i]));
        });

      //= Update data =
       await Promise.all(arrFuncions)
       // .then(async (results) => {console.log(results);})
          .catch(console.log);

      } catch (e) {
        reject(e.stack);
      }

      console.log('* The additional costs *');

      /*************************************************************************
       *** Part 6 - Ratio and fact hours
       ************************************************************************/
      //------------------------------------------------------------------------
      // Build ratioParams for "Ratio" and "factHours"
      //------------------------------------------------------------------------

      let ratioParams = [[], [], []];

      //= l.a.w.t - The list accounting work time =
      let lawt = {
        'name': [],
        'table': []
      };

      for (let i = (xArray[0] - START); i < (xArray[0] - START) + CREW; i++) {
        ratioParams[0].push(registryData[i][4]); //staff
        if (!lawt.name.includes(registryData[i][4])) {
          lawt.name.push(registryData[i][4]); //lawt names
          list.name = encodeURIComponent(registryData[i][4]);
          range = list.name + '!A10:F1500';
          lawt.table.push(await crud.readData(config.sid_2017_2.lawt, range)); //lawt tables
        }
      }

      for (let x = 0; x < xArray.length; x++) {
        ratioParams[1].push([]);
        for (let m = 0; m < cutActionMonths[x].length; m++) {
            ratioParams[1][x].push(cutActionMonths[x][m]); //action month
        }
        ratioParams[2].push(registryData[xArray[x] - START][0]); //sites
      }

      range = list.fot + '!A5:BN77';

      let salaryData = await crud.readData(config.sid_2017_2.salary, range);

      let accruedMonth = config.accruedMonth_2_new;
      let accruedIndex = {
        '7': '',
        '8': '',
        '9': '',
        '10': '',
        '11': '',
        '12': ''
      };

      abc.forEach((letter, l) => {
        for (let month in accruedMonth) {
          if (letter == accruedMonth[month]) {
            accruedIndex[month] = l;
          }
        }
      });

      //------------------------------------------------------------------------
      // Get & Insert "Ratio & factHours"
      //------------------------------------------------------------------------

      let [ratio, factHours] = await getRatioHours(salaryData, lawt, ratioParams, cutContractMonths, accruedIndex, CREW);

      arrFuncions = [];
      arrRange = {
        'ratio': [],
        'factHours': []
      }

      //= Prepare array of ratio range & functions =
      for (let month in COL_MONTH) {
        let letter = COL_MONTH[month][0];
        arrRange.ratio.push(list.development + '!' + letter + START + ':' + letter);
      }

      ratio.forEach((arrValues, i)=> {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017_2.dev, arrRange.ratio[i]));
      });

      //= Prepare array of factHours range & functions =
      for (let month in COL_MONTH) {
        let letter = COL_MONTH[month][1];
        arrRange.factHours.push(list.development + '!' + letter + START + ':' + letter);
      }

      factHours.forEach((arrValues, i)=> {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017_2.dev, arrRange.factHours[i]));
      });

      //= Update data =
      await Promise.all(arrFuncions)
      //  .then(async (results) => {console.log(results);})
        .catch(console.log);

      console.log('* ratioParams for Ratio and factHours *');

      // /*************************************************************************
      //  *** Part 8 - Monitioring
      //  ************************************************************************/
      //
      // //-------------------------------------------------------------
      // // Update date-time in "Monitoring"
      // //-------------------------------------------------------------
      //
      // range = 'main!D4';
      //
      // let now = new Date();
      // now = [
      //   [formatDate(now)]
      // ];
      //
      // await crud.updateData(now, config.sid_2017_2.monit, range)
      // //  .then(async (result) => {console.log(result);})
      //   .catch(console.err);

    } //= End start function =

    resolve('complite!');

  });
}

module.exports = devReg;
