 'use strict';

const config = require('config');
const _ = require('lodash/array');

async function profi2(months) {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    //const sleep = require('../libs/sleep');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const profiQuery = require('../models/db_profi-query');
    const profiRentQuery = require('../models/db_profi_rent-ad-query');
    const kzQuery = require('../models/db_kz-query');
    const kzRentQuery = require('../models/db_kz-rent-ad-query');

    //-------------------------------------------------------------
    // Fetch months
    //-------------------------------------------------------------

    let colMonths = config.profi_MonCols_2017;
    let nowMonths  = {};
    let mode = 0;

    if (arguments.length) {
      nowMonths[months[0]] = colMonths[months[0]];
      nowMonths[months[1]] = colMonths[months[1]];
      colMonths = nowMonths;
      mode = 1;
    }

    //----------------------------------------------------------------
    // Main function Start
    //----------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      let list = '';
      let range = '';
      const START = 8;

      let directions = config.directions.profi2;

      //--------------------------------------------------------------
      // Read data from DDS to RAM
      //--------------------------------------------------------------

      // list = encodeURIComponent('ДДС_Лера');
      // range = list + '!A6:V';
      //
      // let dataDDS = await crud.readData(config.sid_2017.dds, range);
      //
      // // = Normalizing of length "dataDDS" =
      // //normLength(dataDDS);
      //
      // await dbRefresh(pool, 'dds_lera', dataDDS)
      // //  .then(async (result) => {console.log(result);})
      //   .catch(console.log);

      //---------------------------------------------------------------

      //try {

        //--------------------------------------------------------------
        // Build *static* Profi params
        //--------------------------------------------------------------

        let paramsProfi = [[], [], [], [], [], []];
        let dataProfi = '';
        let paramsKZ = [[], [], [], [], [], []];
        let dataKZ = '';
        let namesMonths = [];
        let listKZ = '';
        let rangeKZ = '';
        let months_name = config.months_name;

        list = encodeURIComponent(directions[0]);
        listKZ = encodeURIComponent('КЗ');

        for (let month in colMonths) {
          paramsProfi[2].push(colMonths[month][0]); //Number of months
          paramsKZ[2].push(colMonths[month][0]); //Number of months
          namesMonths.push(month);
          range = list + '!' + colMonths[month][1][0] + '2:' + colMonths[month][1][3] + '5';
          rangeKZ = listKZ + '!' + colMonths[month][1][0] + '2:' + colMonths[month][1][3] + '5';
        }

        dataProfi = await crud.readData(config.sid_2017.profi2, range);

        paramsProfi[0].push(dataProfi[2][0]); //direction
        paramsProfi[1].push(
          dataProfi[3][0],
          dataProfi[3][1],
          dataProfi[3][2],
          dataProfi[3][3]
        ); //articles

        dataKZ = await crud.readData(config.sid_2017.profi2, rangeKZ);

        paramsKZ[0].push(dataKZ[2][0]); //direction
        paramsKZ[1] = paramsProfi[1]; //articles

        //--------------------------------------------------------------
        // Start directions loop
        //--------------------------------------------------------------

        for (let d = 0; d < directions.length; d++){

          if (directions[d] == 'КЗ') {

            //--------------------------------------------------------------
            // Build *dynamic* KZ params
            //--------------------------------------------------------------

            //= Clear *dynamic* KZ params=
            paramsKZ[3] = [];
            paramsKZ[4] = [];
            paramsKZ[5] = [];

            list = encodeURIComponent(directions[d]);
            range = list + '!C' + START + ':G';
            dataKZ = await crud.readData(config.sid_2017.profi2, range);

            for (let i = 0; i < dataKZ.length; i++) {
              let row = dataKZ[i];
              paramsKZ[3].push(row[0]); //themes
              paramsKZ[4].push(row[1]); //city
              paramsKZ[5].push(row[4]); //counterparty
            }

            //--------------------------------------------------------------
            // Get result of The kzQuery & kzRentQuery
            //--------------------------------------------------------------

            let values = await kzQuery(pool, paramsKZ);
            let values2 = await kzRentQuery(pool, paramsKZ, months_name);
            let values3 = [];

            //--------------------------------------------------------------
            // To zip result in stack, prepair array of function and update
            //--------------------------------------------------------------

            let zipValues = [];
            let arrRange = [];
            let arrFuncions = [];

            //= Zip valuses =
            values.forEach(val => {
              let arrArticles = [];
              for (let a = 0; a < val.length; a++) {
                arrArticles.push(val[a]);
              }
              // !! Hardcode 4 params, in future possible more than that
              zipValues.push(_.zip(
                arrArticles[0],
                arrArticles[1],
                arrArticles[2],
                arrArticles[3]
              ));
            });

            //= Prepare array of Range =
            for (let month in colMonths){
              arrRange.push(list + '!' + colMonths[month][1][0] + START + ':' + colMonths[month][1][3]);
            }

            //= Prepare array of Functions =
            zipValues.forEach((arrValues, i) => {
              arrFuncions.push(crud.updateData(arrValues, config.sid_2017.profi2, arrRange[i]));
            });

            //= Update data =
            await Promise.all(arrFuncions)
              //.then(async (results) => {console.log(results);})
              .catch(console.log);

            //--------------------------------------------------------------
            // To zip result, rend and ad in stack, prepair array of
            // function and update
            //--------------------------------------------------------------

            for (let m = 0; m < values2.length; m++) {
              values3.push([[], []]);
              for (let i = 0; i < values2[m][0].length; i++) {
                values3[m][0].push(Number(values2[m][0][i]) + Number(values2[m][1][i]) + Number(values2[m][2][i]));
              }
              values3[m][1] = values2[m][3];
            }

            let zipValues3 = [];
            let arrRange3 = [];
            let arrFuncions3 = [];

            //= Zip valuses =
            values3.forEach(val => {
              let arrArticles = [];
              for (let a = 0; a < val.length; a++) {
                arrArticles.push(val[a]);
              }
              // !! Hardcode 2 params, in future possible more than that
              zipValues3.push(_.zip(
                arrArticles[0],
                arrArticles[1]
              ));
            });

            for (let month in colMonths){
              arrRange3.push(list + '!' + colMonths[month][1][4] + START + ':' + colMonths[month][1][5]);
            }

            zipValues3.forEach((arrValues, i)=> {
              arrFuncions3.push(crud.updateData(arrValues, config.sid_2017.profi2, arrRange3[i]));
            });

            //= Update data =
            await Promise.all(arrFuncions3)
              //.then(async (results) => {console.log(results);})
              .catch(console.log);

          } else {

            //--------------------------------------------------------------
            // Build *dynamic* Profi params
            //--------------------------------------------------------------

            //= Clear *dynamic* Profi params=
            paramsProfi[3] = [];
            paramsProfi[4] = [];
            paramsProfi[5] = [];

            list = encodeURIComponent(directions[d]);
            range = list + '!C' + START + ':G';
            dataProfi = await crud.readData(config.sid_2017.profi2, range);

            for (let i = 0; i < dataProfi.length; i++) {
              let row = dataProfi[i];
              paramsProfi[3].push(row[0]); //themes
              paramsProfi[4].push(row[1]); //city
              paramsProfi[5].push(row[4]); //counterparty
            }

            //--------------------------------------------------------------
            // Get result of The profiQuery & profiRentQuery
            //--------------------------------------------------------------

            let values = await profiQuery(pool, paramsProfi);
            let values2 = await profiRentQuery(pool, paramsProfi, months_name);
            let values3 = [];

            //--------------------------------------------------------------
            // To zip result in stack, prepair array of function and update
            //--------------------------------------------------------------

            let zipValues = [];
            let arrRange = [];
            let arrFuncions = [];

            //= Zip valuses =
            values.forEach(val => {
              let arrArticles = [];
              for (let a = 0; a < val.length; a++) {
                arrArticles.push(val[a]);
              }
              // !! Hardcode 4 params, in future possible more than that
              zipValues.push(_.zip(
                arrArticles[0],
                arrArticles[1],
                arrArticles[2],
                arrArticles[3]
              ));
            });

            //= Prepare array of Range =
            for (let month in colMonths){
              arrRange.push(list + '!' + colMonths[month][1][0] + START + ':' + colMonths[month][1][3]);
            }

            //= Prepare array of Functions =
            zipValues.forEach((arrValues, i)=> {
              arrFuncions.push(crud.updateData(arrValues, config.sid_2017.profi2, arrRange[i]));
            });

            //= Update data =
            await Promise.all(arrFuncions)
              //.then(async (results) => {console.log(results);})
              .catch(console.log);

            //--------------------------------------------------------------
            // To zip result, rend and ad in stack, prepair array of
            // function and update
            //--------------------------------------------------------------

            for (let m = 0; m < values2.length; m++) {
              values3.push([[], []]);
              for (let i = 0; i < values2[m][0].length; i++) {
                values3[m][0].push(Number(values2[m][0][i]) + Number(values2[m][1][i]) + Number(values2[m][2][i]));
              }
              values3[m][1] = values2[m][3];
            }

            let zipValues3 = [];
            let arrRange3 = [];
            let arrFuncions3 = [];

            //= Zip valuses =
            values3.forEach(val => {
              let arrArticles = [];
              for (let a = 0; a < val.length; a++) {
                arrArticles.push(val[a]);
              }
              // !! Hardcode 2 params, in future possible more than that
              zipValues3.push(_.zip(
                arrArticles[0],
                arrArticles[1]
              ));
            });

            for (let month in colMonths){
              arrRange3.push(list + '!' + colMonths[month][1][4] + START + ':' + colMonths[month][1][5]);
            }

            zipValues3.forEach((arrValues, i) => {
              arrFuncions3.push(crud.updateData(arrValues, config.sid_2017.profi2, arrRange3[i]));
            });

            //= Update data =
            await Promise.all(arrFuncions3)
              .then(async (results) => {console.log(results);})
              .catch(console.log);

          }

          resolve('complite!');

        } //= End directions =

      // } catch (e) {
      //   reject(e.stack);
      // }

      console.log('finish');

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      if (mode) {
        range = 'main!C13';
      } else {
        range = 'main!B13';
      }
      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

      //resolve('complite!');

    } //= End start function =

    //crutch for avoid timeout
    //resolve('complite!');

  });
}

module.exports = profi2;
