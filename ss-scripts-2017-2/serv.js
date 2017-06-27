'use strict';

const config = require('config');

async function serv() {
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
    const servQuery = require('../models/db_serv-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = '';
      let range = '';
      const START = 7;
      const MONTHS = [7, 8, 9, 10, 11, 12];
      const colMonths = config.serv_colMonths_2017;

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

        list = encodeURIComponent('Обслуж (реестр)');
        range = list + '!A1:U';
        let servClients = await crud.readData(config.sid_2017_2.serv, range);

        //---------------------------------------------------------------------
        // Build paramsServCients and get & update Pay & date in domain clients
        //---------------------------------------------------------------------

        for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {

          let paramsServCients = [[], [], [], [], []];

          //= Try build params =

          try {

            for (let a = (START - 1); a < servClients.length; a++) {
              if (servClients[a][2] && servClients[a][3]) {
                paramsServCients[0].push(servClients[a][3]); //site
                paramsServCients[1].push(servClients[a][2]); //counterparty
              } else {
                paramsServCients[0].push(' ');
                paramsServCients[1].push(' ');
              }
            }

            paramsServCients[2] = m; //month
            paramsServCients[3].push(servClients[2][18]); //direction
            paramsServCients[4].push(servClients[3][17], servClients[3][18], servClients[3][19]); // articles

          } catch (e) {
            reject(e.stack);
          } finally {

            //console.log(paramsServCients);

            let values = await servQuery(pool, 'dds_olga', paramsServCients);


            let sellPayRange = list + '!' + colMonths[m][0] + START + ':' + colMonths[m][0] + (values[0].length + START);
            let prePayRange = list + '!' + colMonths[m][1] + START + ':' + colMonths[m][1] + (values[0].length + START);
            let addPayRange = list + '!' + colMonths[m][2] + START + ':' + colMonths[m][2] + (values[0].length + START);

            await Promise.all([
              crud.updateData(values[0], config.sid_2017_2.serv, sellPayRange),
              crud.updateData(values[1], config.sid_2017_2.serv, prePayRange),
              crud.updateData(values[2], config.sid_2017_2.serv, addPayRange),
            ])
              //.then(async results => {console.log(results);})
              .catch(console.log);

          }

        } //end MONTHS

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B5';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017_2.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = serv;
