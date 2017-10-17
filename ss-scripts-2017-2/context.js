'use strict';

const config = require('config');

async function context() {
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
    const contextQuery = require('../models/db_context-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = '';
      let range = '';
      const START = 8;
      const MONTHS = [7, 8, 9, 10, 11, 12];
      const colMonths = config.context_colMonths_2017;

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

        list = encodeURIComponent('Контекст (реестр)');
        range = list + '!A1:AC';
        let contextClients = await crud.readData(config.sid_2017_2.context, range);

        //---------------------------------------------------------------------
        // Build paramsContextCients and get & update Pay & date in domain clients
        //---------------------------------------------------------------------

        for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {

          let paramsContextCients = [[], [], [], [], []];

          //= Try build params =

          try {

            for (let a = (START - 1); a < contextClients.length; a++) {
              if (contextClients[a][4] && contextClients[a][5]) {
                paramsContextCients[0].push(contextClients[a][5]); //site
                paramsContextCients[1].push(contextClients[a][4]); //counterparty
              } else {
                paramsContextCients[0].push(' ');
                paramsContextCients[1].push(' ');
              }
            }

            paramsContextCients[2] = m; //month
            paramsContextCients[3].push(contextClients[2][25], contextClients[2][26], contextClients[2][27], contextClients[2][28]); //direction
            paramsContextCients[4].push(contextClients[3][25], contextClients[3][26], contextClients[3][27], contextClients[3][28]); // articles

          } catch (e) {
            reject(e.stack);
          }

          let values = await contextQuery(pool, 'dds_olga', paramsContextCients);

          let sellPayRange = list + '!' + colMonths[m][0] + START + ':' + colMonths[m][0] + (values[0].length + START);
          let prePayRange = list + '!' + colMonths[m][1] + START + ':' + colMonths[m][1] + (values[0].length + START);
          let finalPayRange = list + '!' + colMonths[m][2] + START + ':' + colMonths[m][2] + (values[0].length + START);
          let contextPayRange = list + '!' + colMonths[m][3] + START + ':' + colMonths[m][3] + (values[0].length + START);

          await Promise.all([
            crud.updateData(values[0], config.sid_2017_2.context, sellPayRange),
            crud.updateData(values[1], config.sid_2017_2.context, prePayRange),
            crud.updateData(values[2], config.sid_2017_2.context, finalPayRange),
            crud.updateData(values[3], config.sid_2017_2.context, contextPayRange),
          ])
            //.then(async results => {console.log(results);})
            .catch(console.log);

        } //end MONTHS

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B7';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017_2.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = context;
