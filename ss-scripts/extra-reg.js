'use strict';

const config = require('config');

//------------------------------------------------------------------------------
// Main function
//------------------------------------------------------------------------------

async function extraReg() {
  return new Promise(async (resolve, reject) => {

    console.log('Start: ' + new Date());

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normLength = require('../libs/normalize-length');
    const normType = require('../libs/normalize-type');
    const sleep = require('../libs/sleep');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const extraRegQuery = require('../models/db_extra-reg-query');
    const getRatioHours = require('../libs/extra-reg/getRatioHours');
    const getMargin = require('../libs/extra-reg/getMargin');
    let abc = require('../libs/abc')();

    async function start(auth) {

      const crud = new Crud(auth);

      const CREW = 11;
      const START = 6;
      const YEAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const MONTHS = YEAR.slice(0, 6); // change half-year

      let list = {
        'extra': encodeURIComponent('Доп. работы (реестр)'),
        'clients': encodeURIComponent('Клиенты (доп.работы)'),
        'fot': encodeURIComponent('ФОТ (факт)'),
        'dds_olga': encodeURIComponent('ДДС_Ольга'),
        'name': ''
      };

      let range = '';
      let range1 = '';
      let range2 = '';

      //= Get months cols for develope registryData =
      const COL_MONTH = config.reg_colMonths_1;
      let cols = '';

      //------------------------------------------------------------------------
      // Get Project length (Build xArray)
      //------------------------------------------------------------------------

      range = list.extra + '!A1:A';
      let xLable = await crud.readData(config.sid_2017.extra, range);
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
      let registryData = await crud.readData(config.sid_2017.dev, range);

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      range = list.clients + '!A5:U';
      let clientData= await crud.readData(config.sid_2017.extra, range);

      let contractSum = clientData.map(row => {
        return [
          row[0],
          row[15] && Number(row[15].replace(/\s/g, ''))
          ? Number(row[15].replace(/\s/g, '')) : 0
        ]
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
                 && clientData[i][6].slice(3,5) < 7
                 && clientData[i][6].slice(6) == '2016') {
                 actionMonth[x].push(1);
               } else {
                 actionMonth[x].push(clientData[i][6] && clientData[i][6].slice(3,5) < 7
                   ? Number(clientData[i][6].slice(3,5)) : 1);
               }
               //= Push end month =
               if (clientData[i][10]
                 && clientData[i][10].slice(6) == '2016') {
                 actionMonth[x].push(1);
               } else {
                 actionMonth[x].push(clientData[i][10] && clientData[i][10].slice(3,5) < 7
                    ? Number(clientData[i][10].slice(3,5)) : 6);
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
      //------------------------------------------------------------------------
      // Get & Insert mounth and amount of the act
      //------------------------------------------------------------------------

      let monthAct = clientData.map((row) => {
        return [
          row[0], row[10] ? row[10] : 0,
          row[9] && Number(row[9].replace(/\s/g, ''))
          ? Number(row[9].replace(/\s/g, '')) : 0
        ];
      });

      let colsAct = config.reg_colsAct_1;

      for (let x = 0; x < xArray.length; x++) {

        let month = 0;

        for (let i = 0; i < monthAct.length; i++) {
          if (registryData[xArray[x] - START][0]  == monthAct[i][0]) {
            if (monthAct[i][1]
              && monthAct[i][1].slice(6) == '2016') {
              month = 1;
            } else {
              month = monthAct[i][1] ? Number(monthAct[i][1].substr(3, 2)) : '';
            }

            range = list.extra + '!H' + xArray[x];

            await crud.updateData([[month]], config.sid_2017.extra, range)
              .then(async result => {console.log(result);})
              .catch(console.err);

            if (colsAct[month]) {
              range = list.extra + '!' + colsAct[month] + xArray[x];

              await crud.updateData([[monthAct[i][2]]], config.sid_2017.extra, range)
                .then(async result => {console.log(result);})
                .catch(console.err);
            }

          }
        }
        await sleep(500);
      }
      console.log(new Date());
      console.log('* Get & Insert mounth and amount of the act *');

      // -----------------------------------------------------------------------
      // Build params & update Debt/Prepaid of customers
      // -----------------------------------------------------------------------

      let monthPrepaid = clientData.map((row) => {
        return [
          row[0], row[16] ? row[16] : 0,
          row[15] && Number(row[15].replace(/\s/g, ''))
          ? Number(row[15].replace(/\s/g, '')) : 0
        ];
      });

      range = list.extra + '!A6:CX';

      let clientData2016 = await crud.readData(config.ssId.extra, range);

      let debtData2016raw = clientData2016.map((row) => {
        if (row[101] && Number(row[101].replace(/\s/g, ''))) {
          return [
            row[2], Number(row[101].replace(/\s/g, ''))
          ];
        } else {
          return [];
        }
      });

      let debtData2016 = debtData2016raw.filter(val => {
        if (val[0]) {
          return val;
        }
      });

      //console.log(debtData2016);

      let colDebt = config.colDebt_1.debt;

      //console.log(monthPrepaid);

      for (let x = 0; x < xArray.length; x++) {

        for (let i = 0; i < monthPrepaid.length; i++) {
          if (registryData[xArray[x] - START][0] == monthPrepaid[i][0]) {
            if (!monthPrepaid[i][1] && monthPrepaid[i][2]) {

              range = list.extra + '!' + colDebt + xArray[x];

              await crud.updateData([[-(monthPrepaid[i][2])]], config.sid_2017.extra, range)
                .then(async result => {console.log(result);})
                .catch(console.err);
            }
          }
        }

        for (let j = 0; j < debtData2016.length; j++) {
          if (registryData[xArray[x] - START][0] == debtData2016[j][0]) {

            range = list.extra + '!' + colDebt + xArray[x];

            await crud.updateData([[debtData2016[j][1]]], config.sid_2017.extra, range)
              .then(async result => {console.log(result);})
              .catch(console.err);
          }
        }

        console.log('Project: ' + x);
        await sleep(500);
      }

      console.log(new Date());
      console.log('* Get & Insert Debt / Prepaid *');

      //------------------------------------------------------------------------
      // Refresh DDS (Olga)
      //------------------------------------------------------------------------

      // let srcRows = [];
      // list = encodeURIComponent('ДДС_Ольга');
      // range = list + '!A6:AK';
      //
      // srcRows = await crud.readData(config.sid_2017.dds, range);
      //
      // // = Normalizing of length "srcRows" =
      // normLength(srcRows);
      //
      // await dbRefresh(pool, 'dds_olga', srcRows)
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.err);

      //------------------------------------------------------------------------
      // Build params & update receipt of money from customers (prepaid & finalLy)
      //------------------------------------------------------------------------

      // list = encodeURIComponent('Доп. работы (реестр)');
      // let receiptParams = [[], [[],[]], [], [], []];
      // let value = [];
      //
      // receiptParams[0] = 'Доп.работы по разработке (МТС)';
      // receiptParams[1][0] = 'Поступление денег от клиентов (предоплата)';
      // receiptParams[1][1] = 'Поступление от клиентов (оконч. оплата)';
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   receiptParams[2] = [];
      //   receiptParams[3] = [];
      //   receiptParams[4] = [];
      //   cols = [[], []];
      //
      //   receiptParams[3].push(registry[xArray[x] - START][0]);
      //   receiptParams[4].push(registry[xArray[x] - START][1]);
      //
      //   for (let m = 0; m < MONTHS.length; m++) {
      //     receiptParams[2].push(MONTHS[m]);
      //     cols[0] = cols[0].concat(colMonths[MONTHS[m]].slice(0, 2));
      //     cols[1] = cols[1].concat(colMonths[MONTHS[m]].slice(2, 4));
      //   }
      //
      //   let values = await extraRegQuery(pool, 'dds_olga', receiptParams);
      //
      //   for (let c = 0; c < cols[0].length; c += 2) {
      //
      //     range = list + '!' + cols[0][c] + xArray[x] + ':' + cols[0][c + 1] + xArray[x];
      //     value = [[values[c], values[c + 1]]];
      //
      //     console.log(value);
      //
      //     await crud.updateData(value, config.sid_2017.extra, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //   }
      //   console.log('Project: ' + x);
      // }
      // console.log(new Date());
      // console.log('* The receipt of money from customers (prepaid & finalLy) *');

      // // --------------------------------------------------------------------------
      // // Build ratioParams for "Ratio" and "factHours"
      // // --------------------------------------------------------------------------
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
      //      if (registry[i][7]) {
      //        ratioParams[0][x].push(registry[i][7]);
      //
      //        // = Get object lawt name[0] -> table[0] etc. =
      //        if (!lawt.name.includes(registry[i][7])) {
      //          lawt.name.push(registry[i][7]);
      //          list = encodeURIComponent(registry[i][7]);
      //          range = list + '!B10:L10000';
      //          lawt.table.push(await crud.readData(config.sid_2017.lawt, range));
      //        }
      //     }
      //   }
      //
      //   for (let m = 0; m < cutActionMonths[x].length; m++) {
      //       ratioParams[1][x].push(cutActionMonths[x][m]);
      //   }
      //   ratioParams[2][x].push(registry[xArray[x] - START][0]);
      //
      // }
      //
      // list = encodeURIComponent('ФОТ (факт)');
      // range = list + '!A6:ER77';
      //
      // let salary = await crud.readData(config.sid_2017.salary, range);
      //
      // //--------------------------------------------------------------------------
      // // Get & Insert "Ratio & factHours"
      // //--------------------------------------------------------------------------
      //
      // let [ratio, factHours, warrentyHours] = await getRatio(salary, lawt, ratioParams, cutContractMonths);
      //
      // list = encodeURIComponent('Доп. работы (реестр)');
      //
      // for (let x = 63; x < xArray.length; x++) { //change this
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
      //     await crud.updateData(value, config.sid_2017.extra, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //
      //  }
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
      //     await crud.updateData(value, config.sid_2017.extra, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.err);
      //
      //     //= The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
      //     await sleep(500);
      //   }
      //
      // console.log('Project: ' + x);
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
      //   for (let i = 0; i < 32; i++) {
      //     paramsMargin.push([]);
      //   }
      //
      //   //= Push site in params =
      //   paramsMargin[0].push(registry[xArray[x] - START][0]);
      //
      //   //= Push debt "P" in params =
      //   let col = abc.indexOf(colsMargin.debt);
      //   registry[xArray[x] - START][col] && Number(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //     ? paramsMargin[1].push(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //     : paramsMargin[1].push(0);
      //
      //   //= Push salary of CREW (x11) in params =
      //   for (let i = xArray[x] - START; i < xArray[x] - START + CREW; i++) {
      //     let count = 0;
      //      for (let j = 2; j < (paramsMargin.length - 3); j += quantity) {
      //       let sCol = abc.indexOf(colsMargin.salary[count]);
      //       registry[i][sCol] && Number(registry[i][sCol].replace(/\s/g, '').replace(/,/g, '.'))
      //           ? Number(paramsMargin[j].push(registry[i][sCol].replace(/\s/g, '').replace(/,/g, '.')))
      //           : paramsMargin[j].push(0);
      //       jArray.push(j);
      //
      //       j++;
      //
      //       let wCol = abc.indexOf(colsMargin.warranty[count]);
      //       registry[i][wCol] && Number(registry[i][wCol].replace(/\s/g, '').replace(/,/g, '.'))
      //           ? Number(paramsMargin[j].push(registry[i][wCol].replace(/\s/g, '').replace(/,/g, '.')))
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
      //       registry[xArray[x] - START][col] && Number(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //         ? Number(paramsMargin[n].push(registry[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.')))
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
      //   for (let c = 0; c < contractSum.length; c++) {
      //     if(contractSum[c][0] == paramsMargin[0]) {
      //       margins = margin ? margin / contractSum[c][1] : 0;
      //     }
      //   }
      //
      //   //= Cut to 2 number after poin =
      //   margins = margins.toFixed(2);
      //
      //   list = encodeURIComponent('Доп. работы (реестр)');
      //   range = list + '!N' + xArray[x] + ':O' + xArray[x];
      //
      //   await crud.updateData([[margin, margins]], config.sid_2017.extra, range)
      //     .then(async result => {console.log(result);})
      //     .catch(console.err);
      //
      //     console.log([margin, margins]);
      //
      // }
      // console.log(new Date());
      // console.log('* Update for Margin *');

      // -------------------------------------------------------------
      // Update date-time in "Monitoring"
      // -------------------------------------------------------------

      // range = 'sheet1!B3';
      //
      // let now = new Date();
      // now = [
      //   [formatDate(now)]
      // ];
      //
      // await crud.updateData(now, config.sid_2017.monit, range)
      //   //.then(async (result) => {console.log(result);})
      //   .catch(console.err);
      //
      // console.log('End: ' + new Date());

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = extraReg;
