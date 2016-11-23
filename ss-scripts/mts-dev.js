'use strict';

const config = require('config');

async function getAllHours(normaHour, normaType, params) {
  return new Promise(async(resolve, reject) => {

    //console.log(params);

    let allHours = [];
    let ratio = 0;

    for (let k = 0; k < normaType[0].length; k++) {
      if ( params[0][0] == normaType[0][k][0]) {
        ratio = normaType[0][3];
        ratio = ratio.slice(0, 1);
      }
    }

    for (let i = 0; i < params[1].length; i++) {
      for (let j = 0; j < normaHour.length; j++) {
        if (params[1][i] == normaHour[j][0]) {
          allHours.push([Number(normaHour[j][1]) * Number(ratio)]);
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

async function mtsDevSite() {
  return new Promise(async(resolve, reject) => {

    //--------------------------------------------------------------------------
    // Usres libs
    //--------------------------------------------------------------------------

    require('../libs/auth')(start);

    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const mtsDevQuery = require('../models/db_mts-dev-query');

    async function start(auth) {

      const crud = new Crud(auth);

      //------------------------------------------------------------------------
      // Get data (hours and type) from 'normative'
      //------------------------------------------------------------------------

      let spreadsheetId = '1v7_FqyFbhKZmvINgmTNwk2vpPHPP0p8JMA2l67K_cvM';
      let list = encodeURIComponent('Нормативы');
      let range = list + '!B72:C75';
      let normaHour = await crud.readData(spreadsheetId, range);

      range = list + '!B24:E48';
      let normaType = await crud.readData(spreadsheetId, range);

      //------------------------------------------------------------------------
      // Get data from 'dev-registry'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Разработка (реестр)');
      range = list + '!C6:CL12';
      let devRegistry = await crud.readData(spreadsheetId, range);

      //------------------------------------------------------------------------
      // Build params for allHours
      //------------------------------------------------------------------------

      // let paramsHours = [[], []];
      // paramsHours[0] = devRegistry[0][4];
      //
      // devRegistry.forEach((item, i) => {
      //   if (item[6]) {
      //     paramsHours[1].push(item[6]);
      //   }
      // });

      //------------------------------------------------------------------------
      // Get and Update allHours
      //------------------------------------------------------------------------

      // let allHours = await getAllHours(normaHour, normaType, paramsHours);
      //
      // range = list + '!K6:K12';
      //
      // await crud.updateData(allHours, spreadsheetId, range)
      //   .then(async result => {console.log(result)})
      //   .catch(async err => {console.log(err)});
      //

      //------------------------------------------------------------------------
      // Get and normalize "Contract Sum"
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (разработка)');
      range = list + '!A6:N1000';

      let clientInfo = await crud.readData(spreadsheetId, range);

      let contractSum = clientInfo.map((row, i) => {
        return [row[0], Number(row[row.length - 1].replace(/\s/g, ''))
        ? Number(row[row.length - 1].replace(/\s/g, '')) : 0]
      });

      //------------------------------------------------------------------------
      // Build params for Margin - HELL HARDCODE - Remake!!!
      //------------------------------------------------------------------------

      let paramsMargin = [];

      for (let i = 0; i < 26; i++) {
        paramsMargin.push([]);
      }

      paramsMargin[0].push(devRegistry[0][0]);
      devRegistry[0][13] && Number(devRegistry[0][13])
        ? paramsMargin[1].push(devRegistry[0][13])
        : paramsMargin[1].push(0);

      for (let i = 0; i < devRegistry.length; i++) {
        devRegistry[i][22] && Number(devRegistry[i][22].replace(/\s/g, ''))
          ? paramsMargin[2].push(devRegistry[i][22].replace(/\s/g, ''))
          : paramsMargin[2].push(0);

        devRegistry[i][34] && Number(devRegistry[i][34].replace(/\s/g, ''))
          ? paramsMargin[6].push(devRegistry[i][34].replace(/\s/g, ''))
          : paramsMargin[6].push(0);

        devRegistry[i][46] && Number(devRegistry[i][46].replace(/\s/g, ''))
          ? paramsMargin[10].push(devRegistry[i][46].replace(/\s/g, ''))
          : paramsMargin[10].push(0);

        devRegistry[i][58] && Number(devRegistry[i][58].replace(/\s/g, ''))
          ? paramsMargin[14].push(devRegistry[i][58].replace(/\s/g, ''))
          : paramsMargin[14].push(0);

        devRegistry[i][70] && Number(devRegistry[i][70].replace(/\s/g, ''))
          ? paramsMargin[18].push(devRegistry[i][70].replace(/\s/g, ''))
          : paramsMargin[18].push(0);

        devRegistry[i][82] && Number(devRegistry[i][82].replace(/\s/g, ''))
          ? paramsMargin[22].push(devRegistry[i][82].replace(/\s/g, ''))
          : paramsMargin[22].push(0);
      }

      // Hidden hell harcode
      {
        devRegistry[0][23] && Number(devRegistry[0][23].replace(/\s/g, ''))
          ? paramsMargin[3].push(devRegistry[0][23].replace(/\s/g, ''))
          : paramsMargin[3].push(0);
        devRegistry[0][24] && Number(devRegistry[0][24].replace(/\s/g, ''))
          ? paramsMargin[4].push(devRegistry[0][24].replace(/\s/g, ''))
          : paramsMargin[4].push(0);
        devRegistry[0][25] && Number(devRegistry[0][25].replace(/\s/g, ''))
          ? paramsMargin[5].push(devRegistry[0][25].replace(/\s/g, ''))
          : paramsMargin[5].push(0);

        devRegistry[0][35] && Number(devRegistry[0][35].replace(/\s/g, ''))
          ? paramsMargin[7].push(devRegistry[0][35].replace(/\s/g, ''))
          : paramsMargin[7].push(0);
        devRegistry[0][36] && Number(devRegistry[0][36].replace(/\s/g, ''))
          ? paramsMargin[8].push(devRegistry[0][36].replace(/\s/g, ''))
          : paramsMargin[8].push(0);
        devRegistry[0][37] && Number(devRegistry[0][37].replace(/\s/g, ''))
          ? paramsMargin[9].push(devRegistry[0][37].replace(/\s/g, ''))
          : paramsMargin[9].push(0);

        devRegistry[0][47] && Number(devRegistry[0][47].replace(/\s/g, ''))
          ? paramsMargin[11].push(devRegistry[0][47].replace(/\s/g, ''))
          : paramsMargin[11].push(0);
        devRegistry[0][48] && Number(devRegistry[0][48].replace(/\s/g, ''))
          ? paramsMargin[12].push(devRegistry[0][48].replace(/\s/g, ''))
          : paramsMargin[12].push(0);
        devRegistry[0][49] && Number(devRegistry[0][49].replace(/\s/g, ''))
          ? paramsMargin[13].push(devRegistry[0][49].replace(/\s/g, ''))
          : paramsMargin[13].push(0);

        devRegistry[0][59] && Number(devRegistry[0][59].replace(/\s/g, ''))
          ? paramsMargin[15].push(devRegistry[0][59].replace(/\s/g, ''))
          : paramsMargin[15].push(0);
        devRegistry[0][60] && Number(devRegistry[0][60].replace(/\s/g, ''))
          ? paramsMargin[16].push(devRegistry[0][60].replace(/\s/g, ''))
          : paramsMargin[16].push(0);
        devRegistry[0][61] && Number(devRegistry[0][61].replace(/\s/g, ''))
          ? paramsMargin[17].push(devRegistry[0][61].replace(/\s/g, ''))
          : paramsMargin[17].push(0);

        devRegistry[0][71] && Number(devRegistry[0][71].replace(/\s/g, ''))
          ? paramsMargin[19].push(devRegistry[0][71].replace(/\s/g, ''))
          : paramsMargin[19].push(0);
        devRegistry[0][72] && Number(devRegistry[0][72].replace(/\s/g, ''))
          ? paramsMargin[20].push(devRegistry[0][72].replace(/\s/g, ''))
          : paramsMargin[20].push(0);
        devRegistry[0][73] && Number(devRegistry[0][73].replace(/\s/g, ''))
          ? paramsMargin[21].push(devRegistry[0][73].replace(/\s/g, ''))
          : paramsMargin[21].push(0);

        devRegistry[0][83] && Number(devRegistry[0][83].replace(/\s/g, ''))
          ? paramsMargin[23].push(devRegistry[0][83].replace(/\s/g, ''))
          : paramsMargin[23].push(0);
        devRegistry[0][84] && Number(devRegistry[0][84].replace(/\s/g, ''))
          ? paramsMargin[24].push(devRegistry[0][84].replace(/\s/g, ''))
          : paramsMargin[24].push(0);
        devRegistry[0][85] && Number(devRegistry[0][85].replace(/\s/g, ''))
          ? paramsMargin[25].push(devRegistry[0][85].replace(/\s/g, ''))
          : paramsMargin[25].push(0);
      }


      let margin = await getMargin(contractSum, paramsMargin);

      //console.log(margin);

      list = encodeURIComponent('Разработка (реестр)');
      range = list + '!N6';

      await crud.updateData(margin, spreadsheetId, range)
        .then(async result => {console.log(result)})
        .catch(async err => {console.log(err)});

      //--------------------------------------------------------------------------
      // Get and Update Margins
      //--------------------------------------------------------------------------

      let margins = [[Math.round(margin[0][0] / contractSum[0][1] * 10) / 10]];

      range = list + '!O6';

      await crud.updateData(margins, spreadsheetId, range)
        .then(async result => {console.log(result)})
        .catch(async err => {console.log(err)});

      //--------------------------------------------------------------------------
      // The receipt of money from customers (prepaid & finalLy)
      //--------------------------------------------------------------------------

      // let srcRows = [];
      // list = encodeURIComponent('ДДС_Ольга');
      // range = list + '!A6:AK';
      //
      // srcRows = await crud.readData(spreadsheetId, range);
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
      // Build receiptParams
      //---------------------------------------------------------------

      let receiptParams = [[], [[],[]], [], [], []];

      receiptParams[0] = ['Разработка сайта'];
      receiptParams[1][0] = ['Поступление денег от клиентов (предоплата)'];
      receiptParams[1][1] = ['Поступление от клиентов (оконч. оплата)'];

      receiptParams[2] = ['7'];

      receiptParams[3] = [devRegistry[0][0]];
      receiptParams[4] = [devRegistry[0][1]];

      let value = await mtsDevQuery(pool, 'dds_olga', receiptParams);

      list = encodeURIComponent('Разработка (реестр)');
      range = list + '!S6:T6';

      await crud.updateData(value, spreadsheetId, range)
        .then(async result => {console.log(result)})
        .catch(async err => {console.log(err)});

    }

    resolve('complite!');

  });
}

module.exports = mtsDevSite;
