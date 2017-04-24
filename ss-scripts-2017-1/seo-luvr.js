'use strict';

const config = require('config');

async function seoLuvr() {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    //const normLength = require('../libs/normalize-length');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let range = '';
      const START = 9;

      let list = {
        'manual': encodeURIComponent('Справочник'),
        'listName': function(name) {
          return encodeURIComponent(name);
        }
      };


      function convertData(date) {
        const YEAR = 2017;
        if (date[0].length == 1) {
          date[0] = '0' + date[0];
        }
        if (date[1].length == 1) {
          date[1] = '0' + date[1];
        }
        return date[0] + '.' + date[1] + '.' + YEAR;
      }

      range = list.manual + '!D2:D';
      let seoStuff = await crud.readData(config.sid_2017.seo_luvr, range);

      seoStuff = seoStuff.map(employee => {
        return employee[0];
      });

      seoStuff = ['Косов Владислав'];

      for (let e = 0; e < seoStuff.length; e++) {

        range = list.listName(seoStuff[e]) + '!A2:AE1700';
        let dataSeo = await crud.readData(config.sid_2017.seo_luvr, range);

        let dataDate = [];

        console.log(convertData([dataSeo[2][5], dataSeo[0][5]]));

        console.log(dataSeo[0][5]);
        console.log(dataSeo[2][5]);
        console.log('=======');
        console.log([dataSeo[8][0], dataSeo[8][4], dataSeo[8][5]]);

      }

      //---------------------------------------------------------------------
      // Build paramsSeoCients and get & update Pay & date in domain clients
      //---------------------------------------------------------------------

      // for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {
      //
      //   let paramsSeoCients = [[], [], [], [], []];
      //
      //   try {
      //
      //     //= Build params =
      //     for (let a = (START - 1); a < seoClients.length; a++) {
      //       if (seoClients[a][2] && seoClients[a][3]) {
      //         paramsSeoCients[0].push(seoClients[a][3]); //site
      //         paramsSeoCients[1].push(seoClients[a][2]); //counterparty
      //       } else {
      //         paramsSeoCients[0].push(' ');
      //         paramsSeoCients[1].push(' ');
      //       }
      //     }
      //
      //     paramsSeoCients[2] = m; //month
      //     paramsSeoCients[3].push(seoClients[4][23]); //direction
      //     paramsSeoCients[4].push(seoClients[5][23], seoClients[5][24], seoClients[5][25]); // articles
      //
      //     //= Get values =
      //     let values = await seoQuery(pool, 'dds_olga', paramsSeoCients);
      //
      //     //= Update data =
      //     let sellPayRange = list + '!' + colMonths[m][0] + START + ':' + colMonths[m][0] + (values[0].length + START);
      //     let prePayRange = list + '!' + colMonths[m][1] + START + ':' + colMonths[m][1] + (values[0].length + START);
      //     let addPayRange = list + '!' + colMonths[m][2] + START + ':' + colMonths[m][2] + (values[0].length + START);
      //
      //     await Promise.all([
      //       crud.updateData(values[0], config.sid_2017.seo, sellPayRange),
      //       crud.updateData(values[1], config.sid_2017.seo, prePayRange),
      //       crud.updateData(values[2], config.sid_2017.seo, addPayRange),
      //     ])
      //       //.then(async results => {console.log(results);})
      //       .catch(console.log);
      //
      //   } catch (e) {
      //     reject(e.stack);
      //   }
      //
      // } //end MONTHS

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B6';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = seoLuvr;
