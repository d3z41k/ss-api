'use strict';

const config = require('config');
const _ = require('lodash/array');

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
    const pool = require('../models-2017-1/db_pool');
    const extraRegQuery = require('../models-2017-1/db_extra-reg-query');
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

      range = list.extra + '!C6:DI' + xLable.length;
      let registryData = await crud.readData(config.sid_2017.extra, range);

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

      // let monthAct = clientData.map((row) => {
      //   return [
      //     row[0], row[10] ? row[10] : 0,
      //     row[9] && Number(row[9].replace(/\s/g, ''))
      //     ? Number(row[9].replace(/\s/g, '')) : 0
      //   ];
      // });
      //
      // let colsAct = config.reg_colsAct_1;
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
      //       range = list.extra + '!H' + xArray[x];
      //
      //       await crud.updateData([[month]], config.sid_2017.extra, range)
      //         .then(async result => {console.log(result);})
      //         .catch(console.err);
      //
      //       if (colsAct[month]) {
      //         range = list.extra + '!' + colsAct[month] + xArray[x];
      //
      //         await crud.updateData([[monthAct[i][2]]], config.sid_2017.extra, range)
      //           .then(async result => {console.log(result);})
      //           .catch(console.err);
      //       }
      //
      //     }
      //   }
      //   await sleep(500);
      // }
      // console.log(new Date());
      // console.log('* Get & Insert mounth and amount of the act *');

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

      let ddsData = [];
      range = list.dds_olga + '!A6:AD';

      ddsData = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "srcRows" =
      normLength(ddsData);

      await dbRefresh(pool, 'dds_olga', ddsData)
        .then(async (results) => {console.log(results);})
        .catch(console.err);

      //------------------------------------------------------------------------
      // Build params & update receipt of money from customers (prepaid & finalLy)
      //------------------------------------------------------------------------

      let receiptParams = [[], [[], [], []], [], [], []];

      try {

        receiptParams[0] = 'Доп.работы по разработке (МТС)'; //direction
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

      let values = await extraRegQuery(pool, 'dds_olga', receiptParams, CREW);

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

      //= Prepare array of Range =
      for (let month in COL_MONTH){
        arrRange.push(list.extra + '!' + COL_MONTH[month][0] + START + ':' + COL_MONTH[month][2]);
      }

      //= Prepare array of Functions =
      zipValues.forEach((arrValues, i)=> {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017.extra, arrRange[i]));
      });

      //= Update data =
      await Promise.all(arrFuncions)
        .then(async (results) => {console.log(results);})
        .catch(console.log);

      console.log(new Date());
      console.log('* The receipt of money from customers (prepaid & finally) *');

      // --------------------------------------------------------------------------
      // Build ratioParams for "Ratio" and "factHours"
      // --------------------------------------------------------------------------

      let ratioParams = [[], [], []];

      //= l.a.w.t - The list accounting work time =
      let lawt = {
        'name': [],
        'table': []
      };

      for (let i = (xArray[0] - START); i < (xArray[0] - START) + CREW; i++) {
        ratioParams[0].push(registryData[i][7]); //staff
        if (!lawt.name.includes(registryData[i][7])) {
          lawt.name.push(registryData[i][7]); //lawt names
          list.name = encodeURIComponent(registryData[i][7]);
          range = list.name + '!B10:L1000';
          lawt.table.push(await crud.readData(config.sid_2017.lawt, range)); //lawt tables
        }
      }

      for (let x = 0; x < xArray.length; x++) {
        ratioParams[1].push([]);
        for (let m = 0; m < cutActionMonths[x].length; m++) {
            ratioParams[1][x].push(cutActionMonths[x][m]); //action month
        }
        ratioParams[2].push(registryData[xArray[x] - START][0]); //sites
      }

      range = list.fot + '!A6:ER77';

      let salaryData = await crud.readData(config.sid_2017.salary, range);

      let accruedMonth = config.accruedMonth_1;
      let accruedIndex = {
        '1': '',
        '2': '',
        '3': '',
        '4': '',
        '5': '',
        '6': ''
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

      let [ratio, factHours, warrentyHours] = await getRatioHours(salaryData, lawt, ratioParams, cutContractMonths, accruedIndex);

      arrFuncions = [];
      arrRange = {
        'ratio': [],
        'factHours': [],
        'warrentyHours': []
      }

      //= Prepare array of ratio range & functions =
      for (let month in COL_MONTH) {
        let letter = COL_MONTH[month].slice(3, 4);
        arrRange.ratio.push(list.extra + '!' + letter + START + ':' + letter);
      }

      ratio.forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017.extra, arrRange.ratio[i]));
      });

      //= Prepare array of factHours range & functions =
      for (let month in COL_MONTH) {
        let letter = COL_MONTH[month].slice(4, 5);
        arrRange.factHours.push(list.extra + '!' + letter + START + ':' + letter);
      }

      factHours.forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017.extra, arrRange.factHours[i]));
      });

      //= Prepare array of warrentyHours range & functions =
      for (let month in COL_MONTH) {
        let letter = COL_MONTH[month].slice(5);
        arrRange.warrentyHours.push(list.extra + '!' + letter + START + ':' + letter);
      }

      warrentyHours.forEach((arrValues, i) => {
        arrFuncions.push(crud.updateData(arrValues, config.sid_2017.extra, arrRange.warrentyHours[i]));
      });

      //= Update data =
      await Promise.all(arrFuncions)
        .then(async (results) => {console.log(results);})
        .catch(console.log);

       console.log('* ratioParams for Ratio and factHours *');

       //------------------------------------------------------------------------
       // Build params for Margin
       //------------------------------------------------------------------------

       //= Build ABC for margin params =
       abc = abc.slice(2, 120);
       let colsMargin = config.colsMargin_1;
       let paramsMargin = [[], [], [], [], []];

       try {

         for (let x = 0; x < xArray.length; x++) {

           //paramsMargin = [];

           //= Push site in params =
           paramsMargin[0].push(registryData[xArray[x] - START][0]);

           //= Push cost "P" in params =
           let col = abc.indexOf(colsMargin.cost);
           registryData[xArray[x] - START][col] && Number(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
             ? paramsMargin[1].push(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
             : paramsMargin[1].push(0);
         }
         //--------------------------------------------------------------------

         //console.log(abc.indexOf(colsMargin.salary[0]));

         for (var m = 0; m < MONTHS.length; m++) {
           let sCol = abc.indexOf(colsMargin.salary[m]);
           let wCol = abc.indexOf(colsMargin.warranty[m]);
           let oCol = [];
           for (let i = 0; i < colsMargin.other[m].length; i++) {
             oCol.push(abc.indexOf(colsMargin.other[m][i]));
           }
           paramsMargin[2].push([]);
           paramsMargin[3].push([]);
           paramsMargin[4].push([]);

           for (let x = 0; x < xArray.length; x++) {
             paramsMargin[2][m].push([]);
             paramsMargin[3][m].push([]);
             paramsMargin[4][m].push([]);

             for (let i = 0; i < colsMargin.other[m].length; i++) {
               registryData[xArray[x] - START][oCol[i]] && Number(registryData[xArray[x] - START][oCol[i]].replace(/\s/g, '').replace(/,/g, '.'))
                 ? paramsMargin[4][m][x].push(Number(registryData[xArray[x] - START][oCol[i]].replace(/\s/g, '').replace(/,/g, '.')))
                 : paramsMargin[4][m][x].push(0);
             }

             for (let p = 0; p < registryData.length; p++) {
               if (paramsMargin[0][x] == registryData[p][0]) {

                 registryData[x][sCol] && Number(registryData[p][sCol].replace(/\s/g, '').replace(/,/g, '.'))
                   ? paramsMargin[2][m][x].push(Number(registryData[p][sCol].replace(/\s/g, '').replace(/,/g, '.')))
                   : paramsMargin[2][m][x].push(0);

                 registryData[x][wCol] && Number(registryData[p][wCol].replace(/\s/g, '').replace(/,/g, '.'))
                   ? paramsMargin[3][m][x].push(Number(registryData[p][wCol].replace(/\s/g, '').replace(/,/g, '.')))
                   : paramsMargin[3][m][x].push(0);

               }
             }
           }
         }

       } catch (e) {
         reject(e.stack);
       }

       //= Get & Insert values of "Margin & Margins" =

       let margin = await getMargin(contractSum, paramsMargin);
       let margins = [];
       let marginAll = [];
       let marginsAll = [];

       try {

         for (let p = 0; p < paramsMargin[0].length; p++) {
           margins.push([]);
           for (let c = 0; c < contractSum.length; c++) {
             if(contractSum[c][0] == paramsMargin[0][p]) {
               margins[p].push(margin[p][0] ? margin[p][0] / contractSum[c][1] : 0);

               //= Cut to 2 number after poin =
               margins[p][0] = margins[p][0].toFixed(2);
             }
           }
         }

         for (let p = 0; p < margin.length; p++) {
           marginAll.push(margin[p]);
           marginsAll.push(margins[p]);
           for (let c = 0; c < CREW; c++) {
             marginAll.push([]);
             marginsAll.push([]);
           }
         }

         let colMargin = config.colsMargin_1.margin;
         let colMargins = config.colsMargin_1.margins;

         range1 = list.extra + '!' + colMargin + START + ':' + colMargin;
         range2 = list.extra + '!' + colMargins + START + ':' + colMargins;

       } catch (e) {
         reject(e.stack);
       }

       await Promise.all([
         crud.updateData(marginAll, config.sid_2017.extra, range1),
         crud.updateData(marginsAll, config.sid_2017.extra, range2),
       ])
         .then(async result => {console.log(result);})
         .catch(console.err);

       console.log('* update Margin and Margins *');

      // -------------------------------------------------------------
      // Update date-time in "Monitoring"
      // -------------------------------------------------------------

      range = 'main!D3';

      let now = new Date();
      now = [
        [formatDate(now)]
      ];

      await crud.updateData(now, config.sid_2017.monit, range)
        //.then(async (result) => {console.log(result);})
        .catch(console.err);

      console.log('End: ' + new Date());

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = extraReg;
