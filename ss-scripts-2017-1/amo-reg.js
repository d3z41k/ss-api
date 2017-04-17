'use strict';

const config = require('config');
const _ = require('lodash/array');

//--------------------------------------------------------------------------
// Main function
//--------------------------------------------------------------------------

async function amoReg() {
  return new Promise(async (resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normLength = require('../libs/normalize-length');
    const sleep = require('../libs/sleep');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const amoRegQuery = require('../models-2017-1/db_amo-reg-query');
    const getRatioHours = require('../libs/amo-reg/getRatioHours');
    const getMargin = require('../libs/amo-reg/getMargin');
    let abc = require('../libs/abc')();

    async function start(auth) {

      const crud = new Crud(auth);

      const CREW = 7;
      const START = 11;
      const YEAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const MONTHS = YEAR.slice(0, 6); // change half-year

      let list = {
        'amo': encodeURIComponent('AMO (реестр)'),
        'clients': encodeURIComponent('Клиенты (AMO)'),
        'fot': encodeURIComponent('ФОТ (факт)'),
        'dds_lera': encodeURIComponent('ДДС_Лера'),
        'name': ''
      };

      let range = '';
      let range1 = '';
      let range2 = '';

      //= Get months cols for develope registryData =
      const COL_MONTH = config.reg_colMonths_1;

      //------------------------------------------------------------------------
      // Get Project length (Build xArray)
      //------------------------------------------------------------------------

      range = list.amo + '!A1:A';
      let xLable = await crud.readData(config.sid_2017.amo, range);

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

      range = list.amo + '!C11:DI' + xLable.length;

      let registryData = await crud.readData(config.sid_2017.amo, range);

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      range = list.clients + '!B12:U';
      let clientData = await crud.readData(config.sid_2017.amo, range);

      let contractSum = clientData.map((row) => {
        return [
          row[0],
          row[10] && Number(row[10].replace(/\s/g, ''))
          ? Number(row[10].replace(/\s/g, '')) : 0
        ]
      });

      //------------------------------------------------------------------------
      // Get "Action months & Contract months"
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
            if (registryData[xArray[x] - START][0] == clientData[i][0]) {

              //= Push start month =
              if (clientData[i][7]
                && clientData[i][7].slice(3, 5) < 7
                && clientData[i][7].slice(6) == '2016') {
                actionMonth[x].push(1);
              } else {
                actionMonth[x].push(clientData[i][7] && clientData[i][6].slice(3, 5) < 7
                  ? Number(clientData[i][7].slice(3, 5)) : 1);
              }
              //= Push end month =
              if (clientData[i][11]
                && clientData[i][11].slice(6) == '2016') {
                actionMonth[x].push(1);
              } else {
                actionMonth[x].push(clientData[i][11] && clientData[i][11].slice(3, 5) < 7
                   ? Number(clientData[i][11].slice(3, 5)) : 6);
              }
            }
          }
           actionMonth[x].length = 2;
         }

         //= Get Actual months for a projects =
         actionMonth.forEach((months) => {
             actionMonths.push(YEAR.slice(months[0]));
             contractMonths.push(YEAR.slice(months[0], months[1] + 1));
         });

         //= Сut Action months for a projects =
         actionMonths.forEach((months) => {
           let line = months.filter((month) => {
             return month < 7;
           });
           cutActionMonths.push(line);
         });

         //= Get Contract months for a projects =
         contractMonths.forEach((months) => {
           let line = months.filter((month) => {
             return month < 7;
           });
           cutContractMonths.push(line);
         });

      } catch (e) {
        reject(e.stack);
      }

      //--------------------------------------------------------------------------
      // Get & Insert mounth and amount of the act
      //--------------------------------------------------------------------------

      // let monthAct = clientData.map((row) => {
      //   return [
      //     row[0],
      //     row[11] ? row[11] : 0,
      //     row[10] && Number(row[10].replace(/\s/g, ''))
      //     ? Number(row[10].replace(/\s/g, '')) : 0
      //   ];
      // });
      //
      // let colsAct = config.reg_colsAct_1;
      // let months = [];
      //
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   let month = 0;
      //
      //   for (let i = 0; i < monthAct.length; i++) {
      //     if (registryData[xArray[x] - START][0]  == monthAct[i][0]) {
      //       if (monthAct[i][1]
      //         && monthAct[i][1].slice(6) == '2016') {
      //         month = 1;
      //       } else {
      //         month = monthAct[i][1] ? Number(monthAct[i][1].substr(3, 2)) : '';
      //       }
      //
      //       if (colsAct[month]) {
      //         range = list.amo + '!' + colsAct[month] + xArray[x];
      //
      //         await crud.updateData([[monthAct[i][2]]], config.sid_2017.amo, range)
      //           .then(async result => {console.log(result);})
      //           .catch(console.err);
      //       }
      //
      //       sleep(100)
      //
      //     }
      //   }
      //
      //   months.push([month]);
      //   for (let c = 0; c < CREW; c++) {
      //     months.push([]);
      //   }
      // }
      //
      // range = list.amo + '!H' + START + ':H';

      // await crud.updateData(months, config.sid_2017.amo, range)
      //   .then(async result => {console.log(result);})
      //   .catch(console.err);
      //
      // console.log(new Date());
      // console.log('* Get & Insert mounth and amount of the act *');

      // -----------------------------------------------------------------------
      // Build params & update Debt/Prepaid of customers
      // -----------------------------------------------------------------------

      // let monthPrepaid = clientData.map((row) => {
      //   return [
      //     row[0], row[15] ? row[15] : 0,
      //     row[14] && Number(row[14].replace(/\s/g, ''))
      //     ? Number(row[14].replace(/\s/g, '')) : 0
      //   ];
      // });
      //
      // range = list.amo + '!A6:CX';
      //
      // let clientData2016 = await crud.readData(config.ssId.amo, range);
      //
      // let debtData2016raw = clientData2016.map((row) => {
      //   if (row[101] && Number(row[101].replace(/\s/g, ''))) {
      //     return [
      //       row[2], Number(row[101].replace(/\s/g, ''))
      //     ];
      //   } else {
      //     return [];
      //   }
      // });
      //
      // let debtData2016 = debtData2016raw.filter(val => {
      //   if (val[0]) {
      //     return val;
      //   }
      // });
      //
      // let colDebt = config.colDebt_1.debt;
      //
      // //console.log(monthPrepaid);
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   for (let i = 0; i < monthPrepaid.length; i++) {
      //     if (registryData[xArray[x] - START][0] == monthPrepaid[i][0]) {
      //       if (!monthPrepaid[i][1] && monthPrepaid[i][2]) {
      //
      //         range = list.development + '!' + colDebt + xArray[x];
      //
      //         await crud.updateData([[-(monthPrepaid[i][2])]], config.sid_2017.amo, range)
      //           .then(async result => {console.log(result);})
      //           .catch(console.err);
      //       }
      //     }
      //   }
      //
      //   for (let j = 0; j < debtData2016.length; j++) {
      //     if (registryData[xArray[x] - START][0] == debtData2016[j][0]) {
      //
      //       range = list.amo + '!' + colDebt + xArray[x];
      //
      //       await crud.updateData([[debtData2016[j][1]]], config.sid_2017.amo, range)
      //         .then(async result => {console.log(result);})
      //         .catch(console.err);
      //     }
      //   }
      //
      // }
      //
      // console.log(new Date());
      // console.log('* Get & Insert Debt / Prepaid *');

      // -----------------------------------------------------------------------
      // Refresh DDS (Lera)
      // -----------------------------------------------------------------------

      // let ddsData = [];
      // list = encodeURIComponent('ДДС_Лера');
      // range = list + '!A6:AC';
      //
      // ddsData = await crud.readData(config.ssId.dds, range);
      //
      // // = Normalizing of length "ddsData" =
      // normLength(ddsData);
      //
      // await dbRefresh(pool, 'dds_lera', ddsData)
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.err);

      //---------------------------------------------------------------
      // Build receiptParams The receipt of money from customers (prepaid & finalLy)
      //---------------------------------------------------------------

      let receiptParams = [[], [[], [], []], [], [], []];

      try {

        receiptParams[0] = [
          'Интеграция (AMO)',
          'Обслуживание (AMO)',
          'Виджеты разработка (AMO)',
          'Виджеты готовые (AMO)',
          'Доп. работы (АМО)',
          'Лицензия АМО'
        ]; //direction
        receiptParams[1][0] = 'Поступление от новых клиентов (продажа)'; //article
        receiptParams[1][1] = 'Поступление денег от сущ.клиентов (предоплата)'; //article
        receiptParams[1][2] = 'Поступление от сущ.клиентов (оконч. оплата)'; //article
        receiptParams[2] = [1, 2, 3, 4, 5, 6];

        for (let x = 0; x < xArray.length; x++) {
          receiptParams[3].push(registryData[xArray[x] - START][0]); //site
          receiptParams[4].push(registryData[xArray[x] - START][1]); //counterparty
        }

      } catch (e) {
        reject(e.stack)
      }

      //console.log(receiptParams);

      let values = await amoRegQuery(pool, 'dds_lera', receiptParams, CREW);

      let zipValues = [];
      let arrRange = [];
      let arrFuncions = [];

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

      console.log(zipValues);

      //= Prepare array of Range =
      for (let month in COL_MONTH){
        arrRange.push(list.amo + '!' + COL_MONTH[month][0] + START + ':' + COL_MONTH[month][2]);
      }

      //= Prepare array of Functions =
      zipValues.forEach((arrValues, i)=> {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017.amo, arrRange[i]));
      });

      //= Update data =
      await Promise.all(arrFuncions)
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      console.log(new Date());
      console.log('* The receipt of money from customers (prepaid & finally) *');

      //--------------------------------------------------------------------------
      // Build ratioParams for "Ratio" and "factHours"
      //--------------------------------------------------------------------------
      //
      // let ratioParams = [[], [], []];
      //
      // //= l.a.w.t - The list accounting work time =
      // let lawt = {
      //   name: [],
      //   table: []
      // };
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   ratioParams[0].push([]);
      //   ratioParams[1].push([]);
      //   ratioParams[2].push([]);
      //
      //   for (let i = (xArray[x] - START); i < (xArray[x] - START) + CREW; i++) {
      //      if (registryData[i][7]) {
      //        ratioParams[0][x].push(registryData[i][7]);
      //
      //        // = Get object lawt name[0] -> table[0] etc. =
      //        if (!lawt.name.includes(registryData[i][7])) {
      //          lawt.name.push(registryData[i][7]);
      //          list = encodeURIComponent(registryData[i][7]);
      //          range = list + '!B10:L1000';
      //          lawt.table.push(await crud.readData(config.ssId.lawt, range));
      //        }
      //     }
      //   }
      //
      //   for (var m = 0; m < cutActionMonths[x].length; m++) {
      //       ratioParams[1][x].push(cutActionMonths[x][m]);
      //   }
      //   ratioParams[2][x].push(registryData[xArray[x] - START][0]);
      //   ratioParams[2][x].push(registryData[xArray[x] - START][4]);
      //
      // }
      //
      // list = encodeURIComponent('ФОТ (факт)');
      // range = list + '!A6:ER77';
      //
      // let salary = await crud.readData(config.ssId.salary, range);
      //
      // //--------------------------------------------------------------------------
      // // Get & Insert "Ratio & factHours"
      // //--------------------------------------------------------------------------
      //
      // let [ratio, factHours, warrentyHours] = await getRatio(salary, lawt, ratioParams, cutContractMonths);
      //
      // //console.log(factHours);
      //
      // list = encodeURIComponent('AMO (реестр)');
      //
      // for (let x = 0; x < xArray.length; x++) {
      //   cols = [[], [], []];
      //
      //   for (let m = 0; m < cutActionMonths[x].length; m++) {
      //      cols[1] = cols[1].concat(colMonths[cutActionMonths[x][m]].slice(2, 4));
      //   }
      //
      //   for (let c = 0; c < cols[1].length; c += 2) {
      //
      //     range = list + '!' + cols[1][c] + xArray[x] + ':' + cols[1][c + 1] + (xArray[x] + (CREW - 1));
      //     let value = [];
      //     if (!c) {
      //       value = [];
      //       for (let i = 0; i < CREW; i++) {
      //         if (i < ratio[x][c].length){
      //           value.push([ratio[x][c][i], factHours[x][c][i]]);
      //         } else {
      //           value.push([0, 0]);
      //         }
      //
      //       }
      //     } else {
      //       value = [];
      //       for (let i = 0; i < CREW; i++) {
      //         if (i < ratio[x][c / 2].length) {
      //           value.push([ratio[x][c / 2][i], factHours[x][c / 2][i]]);
      //         } else {
      //           value.push([0, 0]);
      //         }
      //
      //       }
      //     }
      //
      //     await crud.updateData(value, config.ssId.amo, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //
      //   }
      //
      //   let value = [];
      //
      //   for (let m = 0; m < cutActionMonths[x].length; m++) {
      //      cols[2] = cols[2].concat(colMonths[cutActionMonths[x][m]].slice(4));
      //   }
      //
      //   for (let c = 0; c < cols[2].length; c++) {
      //     range = list + '!' + cols[2][c] + xArray[x] + ':' + cols[2][c] + (xArray[x] + (CREW - 1));
      //     value = [];
      //
      //     for (let i = 0; i < CREW; i++) {
      //       value.push([warrentyHours[x][c][i] ? warrentyHours[x][c][i] : 0]);
      //     }
      //
      //     await crud.updateData(value, config.ssId.amo, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //   }
      //
      //   console.log('Project: ' + x);
      //
      // }
      // console.log(new Date());
      // console.log('* ratioParams for Ratio and factHours *');

      //------------------------------------------------------------------------
      // Build params for Margin
      //------------------------------------------------------------------------

      // //= Build ABC for margin params =
      // abc = abc.slice(2, 120);
      // let colsMargin = config.colsMargin;
      //
      // const quantity = 4;
      // let jArray = [];
      //
      // for (let x = 0; x < xArray.length; x++) {
      //   let paramsMargin = [];
      //
      //   for (let i = 0; i < 26; i++) {
      //     paramsMargin.push([]);
      //   }
      //
      //   //= Push site in params =
      //   paramsMargin[0].push(registryData[xArray[x] - START][0]);
      //
      //   //= Push debt "P" in params =
      //   let col = abc.indexOf(colsMargin.debt);
      //   registryData[xArray[x] - START][col] && Number(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //     ? paramsMargin[1].push(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //     : paramsMargin[1].push(0);
      //
      //   //= Push salary of CREW (x7) in params =
      //   for (let i = xArray[x] - START; i < xArray[x] - START + CREW; i++) {
      //     let count = 0;
      //     for (let j = 2; j < (paramsMargin.length - 3); j += quantity) {
      //       let col = abc.indexOf(colsMargin.salary[count]);
      //       registryData[i][col] && Number(registryData[i][col].replace(/\s/g, '').replace(/,/g, '.'))
      //           ? paramsMargin[j].push(registryData[i][col].replace(/\s/g, '').replace(/,/g, '.'))
      //           : paramsMargin[j].push(0);
      //
      //       jArray.push(j);
      //       count++;
      //     }
      //   }
      //
      //   //= Push other cost (common for project) in params =
      //   let count = 0;
      //
      //   for (let n = 3; n < paramsMargin.length; n++) {
      //     if (!jArray.includes(n)) {
      //       let col = abc.indexOf(colsMargin.other[count]);
      //       registryData[xArray[x] - START][col] && Number(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //         ? paramsMargin[n].push(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //         : paramsMargin[n].push(0);
      //       count++;
      //     }
      //   }
      //
      //   //console.log(paramsMargin);
      //
      //   //= Get & Insert values of "Margin & Margins" =
      //   let margin = await getMargin(contractSum, paramsMargin);
      //   let margins = 0;
      //
      //   for (var c = 0; c < contractSum.length; c++) {
      //     if(contractSum[c][0] == paramsMargin[0]) {
      //       margins = margin ? margin / contractSum[c][1] : 0;
      //     }
      //   }
      //
      //   //= Cut to 2 number after poin =
      //   margins = margins.toFixed(2);
      //
      //   list = encodeURIComponent('AMO (реестр)');
      //   range = list + '!N' + xArray[x] + ':O' + xArray[x];
      //
      //   await crud.updateData([[margin, margins]], config.ssId.amo, range)
      //     .then(async result => {console.log(result);})
      //     .catch(console.err);
      //
      //   console.log([margin, margins]);
      //
      //   }
      //   console.log(new Date());
      //   console.log('* Update for Margin *');

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      // range = 'sheet1!B4';
      //
      // let now = new Date();
      // now = [
      //   [formatDate(now)]
      // ];
      //
      // await crud.updateData(now, config.ssId.monit, range)
      //   //.then(async (result) => {console.log(result);})
      //   .catch(console.err);
      //
      // console.log('End: ' + new Date());

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = amoReg;
