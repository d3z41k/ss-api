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

async function getRatio(salary, lawt, params) {
  return new Promise(async(resolve, reject) => {

    if (!salary || !lawt || !params) {
      reject('Empty arguments!');
    }

    let sum = [];
    let divider = 0;
    let dividers = [];
    let ratio = [];
    let factHours = [];

    let ratioMonth = config.ratioMonth;

    // Build the salary sum for each month

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

    // console.log(sum);

    // = Build divider =

    let months = [7, 8, 9, 10, 11, 12];

    for (let n = 0; n < lawt.name.length; n++) {
      dividers.push([]);
      dividers[n].push(lawt.name[n]);
      dividers[n].push([]);

      for (let m = 0; m < months.length; m++) {
        divider = 0;
        for (let t = 0; t < lawt.table[n].length; t++) {
          if (Number((lawt.table[n][t][0].substr(3,2)) == months[m]) && (lawt.table[n][t][5])) {
             divider += Number(lawt.table[n][t][5].replace(/,/g, '.'));
          }
        }
        dividers[n][1].push(Math.round(divider * 100) / 100);
      }
    }

    //console.log(dividers);

    // = Build ratio =

    const crew = 7;
    let sal = 0;
    let div = 0;

    for (let p = 0; p < params[0].length ; p++) {
      ratio.push([]);
      for (let m = 0; m < params[1][p].length; m++) {
        ratio[p].push([]);
        for (let c = 0; c < crew; c++) {
          for (let d = 0; d < dividers.length; d++) {
            if (dividers[d][0] == params[0][p][c]) {
              div = dividers[d][1][params[1][p][m] - 7];
              sal = sum[p][params[1][p][m] - params[1][p][0]][c] ? sum[p][params[1][p][m] - params[1][p][0]][c] : 0;
              ratio[p][m].push(div ? Math.round(sal / div * 10) / 10 : 0);
            }
          }
        }
      }
    }

    // = Build factHours =

    for (let p = 0; p < params[0].length ; p++) {
      factHours.push([]);
      for (let m = 0; m < params[1][p].length; m++) {
        factHours[p].push([]);
        for (let c = 0; c < crew; c++) {
          let factHour = 0;
          for (let n = 0; n < lawt.name.length; n++) {

            if (lawt.name[n] == params[0][p][c]) {
              for (let t = 0; t < lawt.table[n].length; t++) {

                if (Number(lawt.table[n][t][0].substr(3,2)) == params[1][p][m]
                  && lawt.table[n][t][2] == params[2][p]) {
                    factHour += Number(lawt.table[n][t][5].replace(/,/g, '.'));
                }

              }
              factHours[p][m].push(Math.round(factHour * 10) / 10);
            }

          }
        }
      }
    }

    resolve([ratio, factHours]);

  });

}

async function getMargin(contractSum, params) {
  return new Promise(async(resolve, reject) => {

    let margin = 0;
    let sub = 0;

    // = Add "P" =
    sub += Number(params[1]);

    // = Y-AB, AK-AN, AW-AZ, BI-BL =
    for (let i = 2; i < params.length; i++) {
      params[i].forEach((value) => {
        sub += Number(value);
      })
    }

    for (var c = 0; c < contractSum.length; c++) {
      if(contractSum[c][0] == params[0]) {
        margin = contractSum[c][1] - sub;
      }
    }

    resolve(margin);
  });

}

//--------------------------------------------------------------------------
// Main function
//--------------------------------------------------------------------------

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
      let counts = 0;

      for (let i = 0; i < (srcNormaType.length - 1); i++) {
        if (srcNormaType[i][0] == srcNormaType[i + 1][0]) {
          normaType.push([]);
          normaType[counts].push(srcNormaType[i][0]);
          normaType[counts].push(srcNormaType[i][3] ? srcNormaType[i][3] : srcNormaType[i + 1][3]);
          counts++;
        }
      }

      //------------------------------------------------------------------------
      // Get and Update allHours
      //------------------------------------------------------------------------

      let allHours = await getAllHours(normaHour, normaType, paramsHours);

      list = encodeURIComponent('Разработка (реестр)');

      // = don't remove empty value? =

      for (let x = 0; x < xArray.length; x++) {
        range = list + '!K'+ xArray[x] +':K' + (xArray[x] + crew - 1);
        await crud.updateData(allHours[x], config.ssId.mts_dev, range)
          .then(async result => {console.log(result);})
          .catch(console.log);
      }

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (разработка)');
      range = list + '!A6:U300';

      let clientInfo = await crud.readData(config.ssId.mts_dev, range);

      let contractSum = clientInfo.map((row) => {
        return [row[0], Number(row[13].replace(/\s/g, ''))
        ? Number(row[13].replace(/\s/g, '')) : 0]
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

      //------------------------------------------------------------------------
      // The receipt of money from customers (prepaid & finalLy)
      //------------------------------------------------------------------------

      let srcRows = [];
      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AK';

      srcRows = await crud.readData(config.ssId.dds, range);
      srcRows = normLength(srcRows);

      //---------------------------------------------------------------
      // Normalizing of length "srcRows"
      //---------------------------------------------------------------

      function normLength(srcRows){
        for (let i = 0; i < srcRows.length; i++) {
          if (srcRows[i][0] == '' &&
            srcRows[i + 1][0] == '' &&
            srcRows[i + 2][0] == '') {
            return srcRows.length = i;
          }
        }
      }

      await dbRefresh(pool, 'dds_olga', srcRows)
        .then(async (results) => {console.log(results)})
        .catch(async (err) => {console.log(err)});

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

      list = encodeURIComponent('Разработка (реестр)');
      let receiptParams = [[], [[],[]], [], [], []];
      let cols = [[], []];
      let value = [];

      // = Get months cols for develope registry =

      const colMonths = config.dev_colMonths;

      receiptParams[0] = 'Разработка сайта';
      receiptParams[1][0] = 'Поступление денег от клиентов (предоплата)';
      receiptParams[1][1] = 'Поступление от клиентов (оконч. оплата)';

      for (let x = 0; x < xArray.length; x++) {

        receiptParams[2] = [];
        receiptParams[3] = [];
        receiptParams[4] = [];
        cols = [[], []];

        receiptParams[3].push(devRegistry[xArray[x] - 6][0]);
        receiptParams[4].push(devRegistry[xArray[x] - 6][1]);

        for (let m = 0; m < cutActionMonths[x].length; m++) {
          receiptParams[2].push(cutActionMonths[x][m]);
          cols[0] = cols[0].concat(colMonths[cutActionMonths[x][m]].slice(0,2));
          cols[1] = cols[1].concat(colMonths[cutActionMonths[x][m]].slice(2));
        }

        let values = await mtsDevQuery(pool, 'dds_olga', receiptParams);

        for (let c = 0; c < cols[0].length; c += 2) {

          range = list + '!' + cols[0][c] + xArray[x] + ':' + cols[0][c + 1] + xArray[x];
          value = [[values[c], values[c + 1]]];

          await crud.updateData(value, config.ssId.mts_dev, range)
            .then(async result => {console.log(result);})
            .catch(console.log);

          // = The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
          await sleep(800);

        }

      }

      //--------------------------------------------------------------------------
      // Build ratioParams for "Ratio" and "factHours"
      //--------------------------------------------------------------------------

      let ratioParams = [[], [], []];

      // = l.a.w.t - The list accounting work time =
      let lawt = {
        name: [],
        table: []
      };

      for (let x = 0; x < xArray.length; x++) {

        ratioParams[0].push([]);
        ratioParams[1].push([]);
        ratioParams[2].push([]);

        for (let i = (xArray[x] - 6); i < (xArray[x] - 6) + crew; i++) {
           if (devRegistry[i][7]) {
             ratioParams[0][x].push(devRegistry[i][7]);

             // = Get object lawt name[0] -> table[0] etc. =
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

      list = encodeURIComponent('ФОТ (факт)');
      range = list + '!A6:ER77';

      let salary = await crud.readData(config.ssId.salary, range);

      //--------------------------------------------------------------------------
      // Get & Insert "Ratio & factHours"
      //--------------------------------------------------------------------------

      let [ratio, factHours] = await getRatio(salary, lawt, ratioParams);

      list = encodeURIComponent('Разработка (реестр)');

      for (let x = 0; x < xArray.length; x++) {
        cols = [[], []];

        for (let m = 0; m < cutActionMonths[x].length; m++) {
           cols[1] = cols[1].concat(colMonths[cutActionMonths[x][m]].slice(2));
        }

        for (let c = 0; c < cols[1].length; c += 2) {
          range = list + '!' + cols[1][c] + xArray[x] + ':' + cols[1][c + 1] + (xArray[x] + 6);
          let value = [];
          if (!c) {
            value = [];
            for (let i = 0; i < crew; i++) {
              if (i < ratio[x][c].length){
                value.push([ratio[x][c][i], factHours[x][c][i]]);
              } else {
                value.push([0, 0]);
              }

            }
          } else {
            value = [];
            for (let i = 0; i < crew; i++) {
              if (i < ratio[x][c / 2].length) {
                value.push([ratio[x][c / 2][i], factHours[x][c / 2][i]]);
              } else {
                value.push([0, 0]);
              }

            }
          }

          await crud.updateData(value, config.ssId.mts_dev, range)
          //.then(async result => {console.log(result);})
            .catch(console.log);

          // = The sleep for avoid of limit quota ("Write requests per 100 seconds per user") =
          await sleep(800);
        }
      }

      //------------------------------------------------------------------------
      // Build params for Margin
      //------------------------------------------------------------------------

      for (let x = 0; x < xArray.length; x++) {
        let paramsMargin = [];

        for (let i = 0; i < 26; i++) {
          paramsMargin.push([]);
        }

        // = Push site in params =
        paramsMargin[0].push(devRegistry[xArray[x] - 6][0]);

        // = Push "P" in params =
        devRegistry[xArray[x] - 6][13] && Number(devRegistry[xArray[x] - 6][13].replace(/\s/g, '').replace(/,/g, '.'))
          ? paramsMargin[1].push(devRegistry[xArray[x] - 6][13].replace(/\s/g, '').replace(/,/g, '.'))
          : paramsMargin[1].push(0);

        // = Push "Y, AK, AW, BI" (x7 crew) in params =
        const quantity = 4;
        let jArray = [];

        for (let i = xArray[x] - 6; i < xArray[x] - 6 + crew; i++) {
            let step = 10;

            for (let j = 2; j < (paramsMargin.length - 3); j += quantity) {
                devRegistry[i][step + 12] && Number(devRegistry[i][step + 12].replace(/\s/g, '').replace(/,/g, '.'))
                    ? paramsMargin[j].push(devRegistry[i][step + 12].replace(/\s/g, '').replace(/,/g, '.'))
                    : paramsMargin[j].push(0);
                jArray.push(j);
                step += 12;
            }
        }

        // = Push "Z-AB, AL-AN, AX-AZ, BJ-BL" (common for project) in params =
        let factor = 20;
        let count = 0;

        for (let n = 3; n < paramsMargin.length; n++) {
            if (!jArray.includes(n)) {
                devRegistry[xArray[x] - 6][n + factor] && Number(devRegistry[xArray[x] - 6][n + factor].replace(/\s/g, '').replace(/,/g, '.'))
                    ? paramsMargin[n].push(devRegistry[xArray[x] - 6][n + factor].replace(/\s/g, '').replace(/,/g, '.'))
                    : paramsMargin[n].push(0);
                count++;
                if (count >= 3) {
                  factor += 8;
                  count = 0;
                }
            }
        }

        // = Get & Insert values of "Margin & Margins" =
        let margin = await getMargin(contractSum, paramsMargin);
        let margins = 0;

        for (var c = 0; c < contractSum.length; c++) {
          if(contractSum[c][0] == paramsMargin[0]) {
            margins = margin ? margin / contractSum[c][1] : 0;
            //console.log(contractSum[c][1]);
          }
        }

        // = cut to 2 number after poin =
        margins = margins.toFixed(2);

        console.log([[margin, margins]]);

        list = encodeURIComponent('Разработка (реестр)');
        range = list + '!N' + xArray[x] + ':O' + xArray[x];

        await crud.updateData([[margin, margins]], config.ssId.mts_dev, range)
          .then(async result => {console.log(result)})
          .catch(async err => {console.log(err)});

      }
    }

    resolve('complite!');

  });
}

module.exports = mtsDevSite;
