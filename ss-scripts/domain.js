'use strict';

const config = require('config');

async function domain() {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const domainQuery = require('../models/db_domain-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = '';
      let range = '';
      const START = 5;
      const MONTHS = [7, 8, 9, 10, 11, 12];
      const colMonths = config.domain_colMonths;

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AK';

      let srcRows = await crud.readData(config.ssId.dds, range);

      // =Normalizing of length "srcRows" =
      normLength(srcRows);

       await dbRefresh(pool, 'dds_olga', srcRows)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

        //------------------------------------------------------------------------
        // Get data from 'domain-registry'
        //------------------------------------------------------------------------

        list = encodeURIComponent('ДХ(реестр)');
        range = list + '!A1:Y';
        let domainClients = await crud.readData(config.ssId.domain, range);

        //------------------------------------------------------------------------
        // Build paramsAmoCients and get & update Pay & date in amo clients
        //------------------------------------------------------------------------


        for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {

          let paramsDomainCients = [[], [], [], [], []];
          let values = [];

          for (let a = START; a < domainClients.length; a++) {
            if (domainClients[a][2] && domainClients[a][3]) {
              paramsDomainCients[0].push(domainClients[a][2]);
              paramsDomainCients[1].push(domainClients[a][3]);
            } else {
              paramsDomainCients[0].push(' ');
              paramsDomainCients[1].push(' ');
            }
          }

          paramsDomainCients[2].push(domainClients[1][17], domainClients[1][21]);
          paramsDomainCients[3].push(domainClients[2][17], domainClients[2][18]);
          paramsDomainCients[4] = m;

          values = await domainQuery(pool, 'dds_olga', paramsDomainCients);

          let prePayRangeD = list + '!' + colMonths[m][0] + '6:' + colMonths[m][0] + (values[0][0].length + 6);
          let addPayRangeD = list + '!' + colMonths[m][1] + '6:' + colMonths[m][1] + (values[0][0].length + 6);
          let prePayRangeH = list + '!' + colMonths[m][2] + '6:' + colMonths[m][2] + (values[0][0].length + 6);
          let addPayRangeH = list + '!' + colMonths[m][3] + '6:' + colMonths[m][3] + (values[0][0].length + 6);

          await Promise.all([
            crud.updateData(values[0][0], config.ssId.domain, prePayRangeD),
            crud.updateData(values[0][1], config.ssId.domain, addPayRangeD),
            crud.updateData(values[1][0], config.ssId.domain, prePayRangeH),
            crud.updateData(values[1][1], config.ssId.domain, addPayRangeH)
          ])
            .then(async results => {console.log(results);})
            .catch(console.log);

        }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'sheet1!B19';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.ssId.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = domain;
