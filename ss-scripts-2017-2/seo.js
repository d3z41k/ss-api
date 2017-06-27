'use strict';

const config = require('config');

async function seo() {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-2/db_refresh');
    const pool = require('../models-2017-2/db_pool');
    const seoQuery = require('../models/db_seo-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = '';
      let range = '';
      const START = 9;
      const MONTHS = [7, 8, 9, 10, 11, 12];
      const colMonths = config.seo_colMonths_2017;

      //-----------------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-----------------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AD';

      let dataDDS = await crud.readData(config.sid_2017_2.dds, range);

      //= Normalizing of length "dataDDS" (not actual) =
      //normLength(dataDDS);

       await dbRefresh(pool, 'dds_olga', dataDDS)
        //.then(async (result) => {console.log(result);})
        .catch(console.log);

        //---------------------------------------------------------------------
        // Get data from 'domain-registry'
        //---------------------------------------------------------------------

        list = encodeURIComponent('SEO (реестр)');
        range = list + '!A1:Z';
        let seoClients = await crud.readData(config.sid_2017_2.seo, range);

        //---------------------------------------------------------------------
        // Build paramsSeoCients and get & update Pay & date in domain clients
        //---------------------------------------------------------------------

        for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {

          let paramsSeoCients = [[], [], [], [], []];

          try {

            //= Build params =
            for (let a = (START - 1); a < seoClients.length; a++) {
              if (seoClients[a][2] && seoClients[a][3]) {
                paramsSeoCients[0].push(seoClients[a][3]); //site
                paramsSeoCients[1].push(seoClients[a][2]); //counterparty
              } else {
                paramsSeoCients[0].push(' ');
                paramsSeoCients[1].push(' ');
              }
            }

            paramsSeoCients[2] = m; //month
            paramsSeoCients[3].push(seoClients[4][23]); //direction
            paramsSeoCients[4].push(seoClients[5][23], seoClients[5][24], seoClients[5][25]); // articles

            //= Get values =
            let values = await seoQuery(pool, 'dds_olga', paramsSeoCients);

            //= Update data =
            let sellPayRange = list + '!' + colMonths[m][0] + START + ':' + colMonths[m][0] + (values[0].length + START);
            let prePayRange = list + '!' + colMonths[m][1] + START + ':' + colMonths[m][1] + (values[0].length + START);
            let addPayRange = list + '!' + colMonths[m][2] + START + ':' + colMonths[m][2] + (values[0].length + START);

            await Promise.all([
              crud.updateData(values[0], config.sid_2017_2.seo, sellPayRange),
              crud.updateData(values[1], config.sid_2017_2.seo, prePayRange),
              crud.updateData(values[2], config.sid_2017_2.seo, addPayRange),
            ])
              //.then(async results => {console.log(results);})
              .catch(console.log);

          } catch (e) {
            reject(e.stack);
          }

      } //end MONTHS

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B6';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017_2.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = seo;
