'use strict';

const config = require('config');
const _ = require('lodash/array');

async function profi1() {
 return new Promise(async (resolve, reject) => {

   //-------------------------------------------------------------------------
   // Usres libs
   //-------------------------------------------------------------------------

   require('../libs/auth')(start);
   const Crud = require('../controllers/crud');
   const formatDate = require('../libs/format-date');
   const sleep = require('../libs/sleep');
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

   //----------------------------------------------------------------
   // Main function Start
   //----------------------------------------------------------------

   async function start(auth) {

     const crud = new Crud(auth);
     let list = '';
     let range = '';
     const START = 8;

     let directions = config.directions.profi1;

     try {

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

       dataProfi = await crud.readData(config.sid_2017.profi1, range);

       paramsProfi[0].push(dataProfi[2][0]); //direction
       paramsProfi[1].push(
         dataProfi[3][0],
         dataProfi[3][1],
         dataProfi[3][2],
         dataProfi[3][3]
       ); //articles

       dataKZ = await crud.readData(config.sid_2017.profi1, rangeKZ);

       paramsKZ[0].push(dataKZ[2][0]); //direction
       paramsKZ[1] = paramsProfi[1]; //articles

       //--------------------------------------------------------------
       // Start directions loop
       //--------------------------------------------------------------

       for (let d = 0; d < directions.length; d++){

         if (directions[d] == 'КЗ') {

           let zipValues = [];
           let zipValues3 = [];
           let zipValuesAll = [];
           let arrRangeAll = [];
           let arrFuncionsAll = [];

           //--------------------------------------------------------------
           // Build *dynamic* KZ params
           //--------------------------------------------------------------

           //= Clear *dynamic* KZ params=
           paramsKZ[3] = [];
           paramsKZ[4] = [];
           paramsKZ[5] = [];

           list = encodeURIComponent(directions[d]);
           range = list + '!C' + START + ':G';
           dataKZ = await crud.readData(config.sid_2017.profi1, range);

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

           //console.log(values);

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

           for (let m = 0; m < values2.length; m++) {
             values3.push([[], []]);
             for (let i = 0; i < values2[m][0].length; i++) {
               values3[m][0].push(Number(values2[m][0][i]) + Number(values2[m][1][i]) + Number(values2[m][2][i]));
             }
             values3[m][1] = values2[m][3];
           }

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

           zipValues.forEach(async (monthValues, m) => {
             zipValuesAll.push([]);
             monthValues.forEach(async (line, l) => {
               zipValuesAll[m].push(_.concat(line, zipValues3[m][l]));
             });
           });

           for (let month in colMonths) {
             arrRangeAll.push(list + '!' + colMonths[month][1][0] + START + ':' + colMonths[month][1][5]);
           }

           zipValuesAll.forEach((arrValues, i)=> {
             arrFuncionsAll.push(crud.updateData(arrValues, config.sid_2017.profi1, arrRangeAll[i]));
           });

           //= Update data =
           await Promise.all(arrFuncionsAll)
          //   .then(async (results) => {console.log(results);})
             .catch(console.log);

         } else {

           let zipValues = [];
           let zipValues3 = [];
           let zipValuesAll = [];
           let arrRangeAll = [];
           let arrFuncionsAll = [];

           //--------------------------------------------------------------
           // Build *dynamic* Profi params
           //--------------------------------------------------------------

           //= Clear *dynamic* Profi params=
           paramsProfi[3] = [];
           paramsProfi[4] = [];
           paramsProfi[5] = [];

           list = encodeURIComponent(directions[d]);
           range = list + '!C' + START + ':G';
           dataProfi = await crud.readData(config.sid_2017.profi1, range);

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

           for (let m = 0; m < values2.length; m++) {
             values3.push([[], []]);
             for (let i = 0; i < values2[m][0].length; i++) {
               values3[m][0].push(Number(values2[m][0][i]) + Number(values2[m][1][i]) + Number(values2[m][2][i]));
             }
             values3[m][1] = values2[m][3];
           }

           zipValuesAll = [];
           arrRangeAll = [];
           arrFuncionsAll = [];

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

           zipValues.forEach(async (monthValues, m) => {
             zipValuesAll.push([]);
             monthValues.forEach(async (line, l) => {
               zipValuesAll[m].push(_.concat(line, zipValues3[m][l]));
             });
           });

           for (let month in colMonths){
             arrRangeAll.push(list + '!' + colMonths[month][1][0] + START + ':' + colMonths[month][1][5]);
           }

           zipValuesAll.forEach((arrValues, i) => {
             arrFuncionsAll.push(crud.updateData(arrValues, config.sid_2017.profi1, arrRangeAll[i]));
           });

           //= Update data =
           await Promise.all(arrFuncionsAll)
             //.then(async (results) => {console.log(results);})
             .catch(console.log)

          console.log(directions[d]);

         } //= End else (profi)

         resolve('complite!');

         //await sleep(15000);

       } //= End directions =

     } catch (e) {
       reject(e.stack);
     }

     //-------------------------------------------------------------
     // Update date-time in "Monitoring"
     //-------------------------------------------------------------

    //  range = 'main!B12';
     //
    //  let now = new Date();
    //  now = [[formatDate(now)]];
     //
    //  await crud.updateData(now, config.sid_2017.monit, range);

     //resolve('complite!');

   } //= End start function =

   //crutch for avoid timeout
   //resolve('complite!');

 });
}

module.exports = profi1;
