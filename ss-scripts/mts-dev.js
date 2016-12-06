'use strict';

const config = require('config');

async function getAllHours(normaHour, normaType, params) {
  return new Promise(async(resolve, reject) => {

    if (!normaHour || !normaType || !params) {
      reject('Empty arguments!');
    }

    let allHours = [];
    let ratio = [];

    for (let p = 0; p < params[0].length; p++) {
      for (let t = 0; t < normaType.length; t++) {
        if (params[0][p] == normaType[t][0]) {
          ratio.push(normaType[t][1].replace(/,/g, '.'));
        }
      }
      if (params[0][p] == 'Доп функционал по разработке') {
        ratio.push('0');
      }
    }

    for (let p = 0; p < params[1].length; p++) {
      allHours.push([]);
      for (let i = 0; i < params[1][p].length; i++) {
        for (let h = 0; h < normaHour.length; h++) {
          if (params[1][p][i] == normaHour[h][0]) {
            allHours[p].push([Number(normaHour[h][1]) * Number(ratio[p])]);
          }
        }
      }
      allHours[p].length = 7;
    }

    for (let i = 0; i < allHours.length; i++) {
      //console.log(allHours[i]);
      for (var j = 0; j < allHours[i].length; j++) {
        if (!allHours[i][j] || allHours[i][j] == 0) {
          allHours[i][j] = [];
        }
      }
    }

    resolve(allHours);
  });

}

async function getMargin(contractSum, params) {
  return new Promise(async(resolve, reject) => {

    //console.log(params);

    let margin = [];
    let sub = 0;

    sub += Number(params[1]);

    for (let i = 2; i < params.length; i++) {
      params[i].forEach((value) => {
        sub += Number(value);
      })
    }

    for (var j = 0; j < contractSum.length; j++) {
      if(contractSum[j][0] == params[0]) {
        margin.push(contractSum[j][1] - sub);

      }

    }

    resolve([margin]);
  });

}

async function getRatio(salary, lawt, params) {
  return new Promise(async(resolve, reject) => {

    if (!salary || !lawt || !params) {
      reject('Empty arguments!');
    }

    let sum = [];
    let dividers = [];
    let ratio = [];
    let factHours = [];
    let ratioMonth = {
      '7': 24,
      '8': 45,
      '9': 66,
      '10': 87,
      '11': 108,
      '12': 129
    };

    for (let p = 0; p < params[0].length; p++) {
      sum.push([]);
      for (let m = 0; m < params[1][p].length; m++) {
        sum[p].push([]);
        for (let i = 0; i < params[0][p].length; i++) {
          for (let s = 0; s < salary.length; s++) {
            if (salary[s][3] == params[0][p][i]) {
              sum[p][m].push(Number(salary[s][ratioMonth[params[1][p][m]]].replace(/\s/g, '')) ?
                Number(salary[s][ratioMonth[params[1][p][m]]].replace(/\s/g, '')) : 0);
            }
          }
        }
      }
    }

    console.log(sum);

    // for (let n = 0; n < lawt.length; n++) {
    //   let divider = 0;
    //   for (let m = 0; m < lawt[n].length; m++) {
    //     if (lawt[n][m][9] == params[1]) {
    //       divider += Number(lawt[n][m][5].replace(/,/g, '.'));
    //     }
    //   }
    //   dividers.push(divider);
    // }
    //
    // for (let k = 0; k < sum.length; k++) {
    //   ratio.push(dividers[k] ? [Math.round(sum[k] / dividers[k] * 10) / 10] : [0]);
    // }
    //
    // for (let x = 0; x < lawt.length; x++) {
    //   let factHour = 0;
    //   for (let y = 0; y < lawt[x].length; y++) {
    //     if (lawt[x][y][9] == params[1] && lawt[x][y][2] == params[2]) {
    //       factHour += Number(lawt[x][y][5].replace(/,/g, '.'));
    //     }
    //   }
    //   factHours.push([factHour]);
    // }

    // console.log(ratio);
    // console.log(factHours);

    //resolve([ratio, factHours]);
    resolve('ok_stub');
  });

}

async function mtsDevSite() {
  return new Promise(async(resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const sleep = require('../libs/sleep');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const mtsDevQuery = require('../models/db_mts-dev-query');

    async function start(auth) {

      const crud = new Crud(auth);

      //------------------------------------------------------------------------
      // Get Project length (Build xArray)
      //------------------------------------------------------------------------

      let list = encodeURIComponent('Разработка (реестр)');
      let range = list + '!A1:A';
      let xLable = await crud.readData(config.ssId.mts_dev, range);
      let xArray = [];

      xLable.forEach((value, x) => {
        if (value == 'x') {
          xArray.push(x + 2);
        }
      });

      xArray.pop();
      xArray.unshift(6);

      //------------------------------------------------------------------------
      // Get data from 'dev-registry'
      //------------------------------------------------------------------------

      range = list + '!C6:CL' + xLable.length;
      let devRegistry = await crud.readData(config.ssId.mts_dev, range);

      //------------------------------------------------------------------------
      // Build params for allHours
      //------------------------------------------------------------------------

      let paramsHours = [[], []];
      const crew = 7;

      for (let x = 0; x < xArray.length; x++) {
        paramsHours[0].push(devRegistry[xArray[x] - 6][4]);
        paramsHours[1].push([]);
        for (let c = (xArray[x] - 6); c < (xArray[x] - 6 + crew); c++) {
            paramsHours[1][x].push(devRegistry[c][6]);
        }
      }

      //------------------------------------------------------------------------
      // Get data (hours and type) from 'normative'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Нормативы');
      range = list + '!B72:C75';
      let normaHour = await crud.readData(config.ssId.mts_dev, range);

      range = list + '!B24:E48';
      let srcNormaType = await crud.readData(config.ssId.mts_dev, range);

      //------------------------------------------------------------------------
      // Normalize srcNormaType
      //------------------------------------------------------------------------

      let normaType = [];
      let count = 0;

      for (let i = 0; i < (srcNormaType.length - 1); i++) {
        if (srcNormaType[i][0] == srcNormaType[i + 1][0]) {
          normaType.push([]);
          normaType[count].push(srcNormaType[i][0]);
          normaType[count].push(srcNormaType[i][3] ? srcNormaType[i][3] : srcNormaType[i + 1][3]);
          count++;
        }
      }

      //------------------------------------------------------------------------
      // Get and Update allHours
      //------------------------------------------------------------------------

      // let allHours = await getAllHours(normaHour, normaType, paramsHours);
      //
      // list = encodeURIComponent('Разработка (реестр)');
      //
      // // don't remove emty value!
      //
      // for (let x = 0; x < xArray.length; x++) {
      //   range = list + '!K'+ xArray[x] +':K' + (xArray[x] + crew - 1);
      //   await crud.updateData(allHours[x], config.ssId.mts_dev, range)
      //     .then(async result => {console.log(result);})
      //     .catch(console.log);
      // }

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (разработка)');
      range = list + '!A6:U300';

      let clientInfo = await crud.readData(config.ssId.mts_dev, range);

      let contractSum = clientInfo.map((row) => {
        return [row[0], Number(row[row.length - 1].replace(/\s/g, ''))
        ? Number(row[row.length - 1].replace(/\s/g, '')) : 0]
      });

      //------------------------------------------------------------------------
      // Get "Action months"
      //------------------------------------------------------------------------

      let actionMonth = [];

      for (let x = 0; x < xArray.length; x++) {
        actionMonth.push([]);
        for (let i = 0; i < clientInfo.length; i++) {
          if (devRegistry[xArray[x] - 6][0]  == clientInfo[i][0]) {
            actionMonth[x].push(clientInfo[i][9] ? Number(clientInfo[i][9].slice(3,5)) : 6);
            actionMonth[x].push(clientInfo[i][20] ? Number(clientInfo[i][20].slice(3,5)) : 12);
          }
        }
        actionMonth[x].length = 2;
      }

      //console.log(actionMonth);

      //------------------------------------------------------------------------
      // The receipt of money from customers (prepaid & finalLy)
      //------------------------------------------------------------------------

      // let srcRows = [];
      // list = encodeURIComponent('ДДС_Ольга');
      // range = list + '!A6:AK';
      //
      // srcRows = await crud.readData(config.ssId.dds, range);
      // srcRowslength = normLength(srcRows);

      //---------------------------------------------------------------
      // Normalizing of length "srcRows"
      //---------------------------------------------------------------

      // function normLength(srcRows){
      //   for (let i = 0; i < srcRows.length; i++) {
      //     if (srcRows[i][0] == '' &&
      //       srcRows[i + 1][0] == '' &&
      //       srcRows[i + 2][0] == '') {
      //       return srcRows.length = i;
      //     }
      //   }
      // }
      //
      // await dbRefresh(pool, 'dds_olga', srcRows.olga)
      //   .then(async (results) => {console.log(results)})
      //   .catch(async (err) => {console.log(err)});

      //---------------------------------------------------------------
      // Get Actual months for a projects
      //---------------------------------------------------------------

      const yearMonths = [0 ,1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      let actionMonths = [];

      actionMonth.forEach((months) => {
          actionMonths.push(yearMonths.slice(months[0], months[1] + 2));
      });

      let cutActionMonths = [];

      actionMonths.forEach((months) => {
        let line = months.filter((month) => {
          return month >= 7;
        });
        cutActionMonths.push(line);
      });

      //---------------------------------------------------------------
      // Build receiptParams
      //---------------------------------------------------------------

      // list = encodeURIComponent('Разработка (реестр)');
      // let receiptParams = [[], [[],[]], [], [], []];
      // let cols = [[], []];
      // let value = [];
      // // Get months cols for develope registry
      // const colMonths = config.dev_colMonths;
      //
      // receiptParams[0] = 'Разработка сайта';
      // receiptParams[1][0] = 'Поступление денег от клиентов (предоплата)';
      // receiptParams[1][1] = 'Поступление от клиентов (оконч. оплата)';
      //
      // for (var x = 0; x < xArray.length; x++) {
      //
      //   receiptParams[2] = [];
      //   receiptParams[3] = [];
      //   receiptParams[4] = [];
      //   cols = [[], []];
      //
      //   receiptParams[3].push(devRegistry[xArray[x] - 6][0]);
      //   receiptParams[4].push(devRegistry[xArray[x] - 6][1]);
      //
      //   for (var m = 0; m < cutActionMonths[x].length; m++) {
      //     receiptParams[2].push(cutActionMonths[x][m]);
      //     cols[0] = cols[0].concat(colMonths[cutActionMonths[x][m]].slice(0,2));
      //     cols[1] = cols[1].concat(colMonths[cutActionMonths[x][m]].slice(2));
      //   }
      //
      //   let values = await mtsDevQuery(pool, 'dds_olga', receiptParams);
      //
      //   for (let c = 0; c < cols[0].length; c += 2) {
      //
      //     range = list + '!' + cols[0][c] + xArray[x] + ':' + cols[0][c + 1] + xArray[x];
      //     value = [[values[c], values[c + 1]]];
      //
      //     await crud.updateData(value, config.ssId.mts_dev, range)
      //       .then(async result => {console.log(result);})
      //       .catch(console.log);
      //
      //     // The sleep for avoid of limit quota ("Write requests per 100 seconds per user")
      //     await sleep(800);
      //
      //   }
      //
      // }

      //--------------------------------------------------------------------------
      // Get "Ratio" and "Hours"
      //--------------------------------------------------------------------------

      let ratioParams = [[], [], []];
      // l.a.w.t - The list accounting work time
      let lawt = {
        name: [],
        table: []
      };

      for (var x = 0; x < xArray.length; x++) {

        ratioParams[0].push([]);
        ratioParams[1].push([]);
        ratioParams[2].push([]);

        for (let i = (xArray[x] - 6); i < (xArray[x] - 6) + crew; i++) {
           if (devRegistry[i][7]) {
             ratioParams[0][x].push(devRegistry[i][7]);

             // Get object lawt name[0] -> table[0] etc.
             if (!lawt.name.includes(devRegistry[i][7])) {
               lawt.name.push(devRegistry[i][7]);
               list = encodeURIComponent(devRegistry[i][7]);
               range = list + '!B10:L1000';
               lawt.table.push(await crud.readData(config.ssId.lawt, range));
             }

          }
        }

        for (var m = 0; m < cutActionMonths[x].length; m++) {
            ratioParams[1][x].push(cutActionMonths[x][m]);
        }

        ratioParams[2][x].push(devRegistry[xArray[x] - 6][0]);

      }

      //console.log(ratioParams);

      list = encodeURIComponent('ФОТ (факт)');
      range = list + '!A6:ER77';

      let salary = await crud.readData(config.ssId.salary, range);

      let ratioAndHours = await getRatio(salary, lawt, ratioParams);

      // console.log(ratioAndHours);
      //
      // list = encodeURIComponent('Разработка (реестр)');
      //
      // let rangeRatio = list + '!W6:W12';
      // let rangeHours = list + '!X6:X12';
      //
      // await Promise.all([
      //   crud.updateData(ratioAndHours[0], config.ssId.mts_dev, rangeRatio),
      //   crud.updateData(ratioAndHours[1], config.ssId.mts_dev, rangeHours),
      // ]).then(async (results) => {
      //   console.log(results);
      // }).catch(console.log);

      //------------------------------------------------------------------------
      // Build params for Margin
      //------------------------------------------------------------------------

      // let paramsMargin = [];
      //
      // for (let i = 0; i < 26; i++) {
      //   paramsMargin.push([]);
      // }
      //
      // paramsMargin[0].push(devRegistry[0][0]);
      // devRegistry[0][13] && Number(devRegistry[0][13].replace(/\s/g, '').replace(/,/g, '.'))
      //   ? paramsMargin[1].push(devRegistry[0][13].replace(/\s/g, '').replace(/,/g, '.'))
      //   : paramsMargin[1].push(0);
      //
      //   const quantity = 4;
      //   let jArray = [];
      //   for (let i = 0; i < devRegistry.length; i++) {
      //       let step = 10;
      //       for (let j = 2; j < (paramsMargin.length - 3); j += quantity) {
      //           devRegistry[i][step + 12] && Number(devRegistry[i][step + 12].replace(/\s/g, '').replace(/,/g, '.'))
      //               ? paramsMargin[j].push(devRegistry[i][step + 12].replace(/\s/g, '').replace(/,/g, '.'))
      //               : paramsMargin[j].push(0);
      //           jArray.push(j);
      //           step += 12;
      //       }
      //   }
      //
      //   let factor = 20;
      //   let count = 0;
      //
      //   for (let n = 3; n < paramsMargin.length; n++) {
      //       if (!jArray.includes(n)) {
      //           devRegistry[0][n + factor] && Number(devRegistry[0][n + factor].replace(/\s/g, '').replace(/,/g, '.'))
      //               ? paramsMargin[n].push(devRegistry[0][n + factor].replace(/\s/g, '').replace(/,/g, '.'))
      //               : paramsMargin[n].push(0);
      //           count++;
      //           if (count >= 3) {
      //               factor += 8;
      //               count = 0;
      //           }
      //       }
      //   }
      //
      // let margin = await getMargin(contractSum, paramsMargin);
      //
      // list = encodeURIComponent('Разработка (реестр)');
      // range = list + '!N6';
      //
      // await crud.updateData(margin, spreadsheetId, range)
      //   .then(async result => {console.log(result)})
      //   .catch(async err => {console.log(err)});

      //--------------------------------------------------------------------------
      // Get and Update Margins
      //--------------------------------------------------------------------------

      // let margins = [[Math.round(margin[0][0] / contractSum[0][1] * 10) / 10]];
      //
      // range = list + '!O6';
      //
      // await crud.updateData(margins, spreadsheetId, range)
      //   .then(async result => {console.log(result)})
      //   .catch(async err => {console.log(err)});

     }

    resolve('complite!');

  });
}

module.exports = mtsDevSite;
