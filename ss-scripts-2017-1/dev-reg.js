'use strict';

const config = require('config');
const _ = require('lodash/array');


//--------------------------------------------------------------------------
// Main function
//--------------------------------------------------------------------------

async function devReg() {
  return new Promise(async (resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normLength = require('../libs/normalize-length');
    const normType = require('../libs/normalize-type');
    const sleep = require('../libs/sleep');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const devRegQuery = require('../models-2017-1/db_dev-reg-query');
    const getPlanHours = require('../libs/dev-reg/getPlanHours');
    const getRatioHours = require('../libs/dev-reg/getRatioHours');
    const getMargin = require('../libs/dev-reg/getMargin');
    let abc = require('../libs/abc')();

    async function start(auth) {

      const crud = new Crud(auth);

      const CREW = 11;
      const START = 6;
      const YEAR = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const MONTHS = YEAR.slice(0, 6); // change half-year
      let list = '';
      let range = '';

      // //= Get months cols for develope registryData =
      const COL_MONTH = config.reg_colMonths_1;
      let cols = '';

      //------------------------------------------------------------------------
      // Get Project length (Build xArray)
      //------------------------------------------------------------------------

      list = encodeURIComponent('Разработка (реестр)');
      range = list + '!A1:A';
      let xLable = await crud.readData(config.sid_2017.dev, range);

      let xArray = [];

      xLable.forEach((value, x) => {
        if (value == 'x') {
          xArray.push(x + 2);
        }
      });

      xArray.pop();
      xArray.unshift(START);

      //console.log(xArray);

      //------------------------------------------------------------------------
      // Get data from 'registryData'
      //------------------------------------------------------------------------

      range = list + '!C6:DI' + xLable.length;
      let registryData = await crud.readData(config.sid_2017.dev, range);

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
       *** Part 1 - All Plan Hourse
       ************************************************************************/

      // //------------------------------------------------------------------------
      // // Get data (hours and type) from 'normative'
      // //------------------------------------------------------------------------
      //
      // list = encodeURIComponent('Нормативы');
      // range = list + '!B72:C75';
      // let normaHour = await crud.readData(config.sid_2017.dev, range);
      //
      // range = list + '!B24:E48';
      // let srcNormaType = await crud.readData(config.sid_2017.dev, range);
      //
      // let normaType = normType(srcNormaType); //normalize srcNormaType
      //
      // //------------------------------------------------------------------------
      // // Get and Update allHours
      // //------------------------------------------------------------------------
      //
      // let planHours = await getPlanHours(normaHour, normaType, paramsHours);
      //
      // list = encodeURIComponent('Разработка (реестр)');
      //
      // range = list + '!K'+ xArray[0] +':K';
      // await crud.updateData(planHours, config.sid_2017.dev, range)
      //   //.then(async result => {console.log(result);})
      //   .catch(console.err);
      //
      // console.log('* Get and Update allHours *');

      /*************************************************************************
       *** Part 2 -
       ************************************************************************/

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (разработка)');
      range = list + '!A6:U300';

      let clientData = await crud.readData(config.sid_2017.dev, range);

      let contractSum = clientData.map((row) => {
        return [
          row[0],
          row[9] && Number(row[9].replace(/\s/g, ''))
          ? Number(row[9].replace(/\s/g, '')) : 0
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

        //console.log(cutActionMonths);

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
      //       list = encodeURIComponent('Разработка (реестр)');
      //       range = list + '!H' + xArray[x];
      //
      //       await crud.updateData([[month]], config.sid_2017.dev, range)
      //         .then(async result => {console.log(result);})
      //         .catch(console.err);
      //
      //       if (colsAct[month]) {
      //         range = list + '!' + colsAct[month] + xArray[x];
      //
      //         await crud.updateData([[monthAct[i][2]]], config.sid_2017.dev, range)
      //           .then(async result => {console.log(result);})
      //           .catch(console.err);
      //       }
      //
      //     }
      //   }
      //   console.log('Project: ' + x);
      // }
      // console.log(new Date());
      // console.log('* Get & Insert mounth and amount of the act *');

      // -----------------------------------------------------------------------
      // Build params & update Debt/Prepaid of customers
      // -----------------------------------------------------------------------

      // let monthPrepaid = clientData.map((row) => {
      //   return [
      //     row[0], row[12] ? row[12] : 0,
      //     row[11] && Number(row[11].replace(/\s/g, ''))
      //     ? Number(row[11].replace(/\s/g, '')) : 0
      //   ];
      // });
      //
      // let colsPrepaid = 'Q';
      //
      // console.log(monthPrepaid);
      //
      // for (let x = 0; x < xArray.length; x++) {
      //
      //   for (let i = 0; i < monthPrepaid.length; i++) {
      //     if (registryData[xArray[x] - START][0]  == monthPrepaid[i][0]) {
      //       if (!monthPrepaid[i][1] && monthPrepaid[i][2]) {
      //         list = encodeURIComponent('Разработка (реестр)');
      //
      //         range = list + '!' + colsPrepaid + xArray[x];
      //
      //         await crud.updateData([[-(monthPrepaid[i][2])]], config.sid_2017.dev, range)
      //           .then(async result => {console.log(result);})
      //           .catch(console.err);
      //       }
      //
      //     }
      //   }
      //   console.log('Project: ' + x);
      // }
      // console.log(new Date());
      // console.log('* Get & Insert Debt / Prepaid *');

      // -----------------------------------------------------------------------
      // Refresh DDS (Olga)
      // -----------------------------------------------------------------------

      // let ddsData = [];
      // list = encodeURIComponent('ДДС_Ольга');
      // range = list + '!A6:AD';
      //
      // ddsData = await crud.readData(config.sid_2017.dds, range);
      //
      // // = Normalizing of length "srcRows" =
      // normLength(ddsData);
      //
      // await dbRefresh(pool, 'dds_olga', ddsData)
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.err);

      // //------------------------------------------------------------------------
      // // Build params & update receipt of money from customers (prepaid & finalLy)
      // //------------------------------------------------------------------------
      //
      // list = encodeURIComponent('Разработка (реестр)');
      // let receiptParams = [[], [[], [], []], [], [], []];
      //
      // try {
      //
      //   receiptParams[0] = 'Разработка сайта'; //direction
      //   receiptParams[1][0] = 'Поступление от новых клиентов (продажа)'; //article
      //   receiptParams[1][1] = 'Поступление денег от сущ.клиентов (предоплата)'; //article
      //   receiptParams[1][2] = 'Поступление от сущ.клиентов (оконч. оплата)'; //article
      //   receiptParams[2] = MONTHS;
      //
      //   for (let x = 0; x < xArray.length; x++) {
      //     receiptParams[3].push(registryData[xArray[x] - START][0]); //site
      //     receiptParams[4].push(registryData[xArray[x] - START][1]); //counterparty
      //   }
      //
      // } catch (e) {
      //   reject(e.stack)
      // }
      //
      // let values = await devRegQuery(pool, 'dds_olga', receiptParams, CREW);
      //
      // let zipValues = [];
      // let arrRange = [];
      // let arrFuncions = [];
      //
      // //= Zip valuses =
      // values.forEach(val => {
      //   let arrArticles = [];
      //   for (let a = 0; a < val.length; a++) {
      //     arrArticles.push(val[a]);
      //   }
      //
      //   // !! Hardcode 6 params, months (a half-year)
      //   zipValues.push(_.zip(
      //     arrArticles[0],
      //     arrArticles[1],
      //     arrArticles[2],
      //     arrArticles[3],
      //     arrArticles[4],
      //     arrArticles[5]
      //   ));
      // });
      //
      // //= Prepare array of Range =
      // for (let month in COL_MONTH){
      //   arrRange.push(list + '!' + COL_MONTH[month][0] + START + ':' + COL_MONTH[month][2]);
      // }
      //
      // //= Prepare array of Functions =
      // zipValues.forEach((arrValues, i)=> {
      //   arrFuncions.push(crud.updateData(arrValues, config.sid_2017.dev, arrRange[i]));
      // });
      //
      // //= Update data =
      // await Promise.all(arrFuncions)
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.log);
      //
      // console.log(new Date());
      // console.log('* The receipt of money from customers (prepaid & finally) *');

      // --------------------------------------------------------------------------
      // Build ratioParams for "Ratio" and "factHours"
      // --------------------------------------------------------------------------

      let ratioParams = [[], [], []];

      //= l.a.w.t - The list accounting work time =
      let lawt = {
        name: [],
        table: []
      };

      for (let i = (xArray[0] - START); i < (xArray[0] - START) + CREW; i++) {
        ratioParams[0].push(registryData[i][7]); //staff
        if (!lawt.name.includes(registryData[i][7])) {
          lawt.name.push(registryData[i][7]); //lawt names
          list = encodeURIComponent(registryData[i][7]);
          range = list + '!B10:L1000';
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

      list = encodeURIComponent('ФОТ (факт)');
      range = list + '!A6:ER77';

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

      list = encodeURIComponent('Разработка (реестр)');

      // let arrFuncions = [];
      // let arrRange = {
      //   'ratio': [],
      //   'factHours': [],
      //   'warrentyHours': []
      // }
      //
      // //= Prepare array of ratio range & functions =
      // for (let month in COL_MONTH) {
      //   let letter = COL_MONTH[month].slice(3, 4);
      //   arrRange.ratio.push(list + '!' + letter + START + ':' + letter);
      // }
      //
      // ratio.forEach((arrValues, i)=> {
      //   arrFuncions.push(crud.updateData(arrValues, config.sid_2017.dev, arrRange.ratio[i]));
      // });
      //
      // //= Prepare array of factHours range & functions =
      // for (let month in COL_MONTH) {
      //   let letter = COL_MONTH[month].slice(4, 5);
      //   arrRange.factHours.push(list + '!' + letter + START + ':' + letter);
      // }
      //
      // factHours.forEach((arrValues, i)=> {
      //   arrFuncions.push(crud.updateData(arrValues, config.sid_2017.dev, arrRange.factHours[i]));
      // });
      //
      // //= Prepare array of warrentyHours range & functions =
      // for (let month in COL_MONTH) {
      //   let letter = COL_MONTH[month].slice(5);
      //   arrRange.warrentyHours.push(list + '!' + letter + START + ':' + letter);
      // }
      //
      // warrentyHours.forEach((arrValues, i) => {
      //   arrFuncions.push(crud.updateData(arrValues, config.sid_2017.dev, arrRange.warrentyHours[i]));
      // });
      //
      // //= Update data =
      // await Promise.all(arrFuncions)
      //   .then(async (results) => {console.log(results);})
      //   .catch(console.log);
      //
      //  console.log('* ratioParams for Ratio and factHours *');

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
      //   paramsMargin[0].push(registryData[xArray[x] - START][0]);
      //
      //   //= Push debt "P" in params =
      //   let col = abc.indexOf(colsMargin.debt);
      //   registryData[xArray[x] - START][col] && Number(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //     ? paramsMargin[1].push(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.'))
      //     : paramsMargin[1].push(0);
      //
      //   //= Push salaryData of CREW (x11) in params =
      //   for (let i = xArray[x] - START; i < xArray[x] - START + CREW; i++) {
      //     let count = 0;
      //      for (let j = 2; j < (paramsMargin.length - 3); j += quantity) {
      //       let sCol = abc.indexOf(colsMargin.salaryData[count]);
      //       registryData[i][sCol] && Number(registryData[i][sCol].replace(/\s/g, '').replace(/,/g, '.'))
      //           ? Number(paramsMargin[j].push(registryData[i][sCol].replace(/\s/g, '').replace(/,/g, '.')))
      //           : paramsMargin[j].push(0);
      //       jArray.push(j);
      //
      //       j++;
      //
      //       let wCol = abc.indexOf(colsMargin.warranty[count]);
      //       registryData[i][wCol] && Number(registryData[i][wCol].replace(/\s/g, '').replace(/,/g, '.'))
      //           ? Number(paramsMargin[j].push(registryData[i][wCol].replace(/\s/g, '').replace(/,/g, '.')))
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
      //         ? Number(paramsMargin[n].push(registryData[xArray[x] - START][col].replace(/\s/g, '').replace(/,/g, '.')))
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
      //   list = encodeURIComponent('Разработка (реестр)');
      //   range = list + '!N' + xArray[x] + ':O' + xArray[x];
      //
      //   await crud.updateData([[margin, margins]], config.sid_2017.dev, range)
      //     .then(async result => {console.log(result);})
      //     .catch(console.err);
      //
      //     console.log([margin, margins]);
      //
      // }
      // console.log(new Date());
      // console.log('* Update for Margin *');

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
      // await crud.updateData(now, config.sid_2017.monit, range)
      //   //.then(async (result) => {console.log(result);})
      //   .catch(console.err);
      //
      // console.log('End: ' + new Date());

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = devReg;
