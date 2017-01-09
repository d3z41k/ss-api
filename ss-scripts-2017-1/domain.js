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
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models/db_pool');
    const domainQuery = require('../models/db_domain-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = '';
      let range = '';
      const START = 7;
      const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const colMonths = config.domain_colMonths2017;

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AD';

      let srcRows = await crud.readData(config.sid_2017.dds, range);

      // =Normalizing of length "srcRows" =
      //normLength(srcRows);

       await dbRefresh(pool, 'dds_olga', srcRows)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

        //------------------------------------------------------------------------
        // Get data from 'domain-registry'
        //------------------------------------------------------------------------

        list = encodeURIComponent('ДХ(реестр)');
        range = list + '!A1:AA';
        let domainClients = await crud.readData(config.sid_2017.domain, range);

        //------------------------------------------------------------------------
        // Build paramsDomainCients and get & update Pay & date in domain clients
        //------------------------------------------------------------------------

        for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {

          let paramsDomainCients = [[], [], [], [], []];
          let values = [];

          for (let a = (START - 1); a < domainClients.length; a++) {
            if (domainClients[a][2] && domainClients[a][3]) {
              paramsDomainCients[0].push(domainClients[a][2]);
              paramsDomainCients[1].push(domainClients[a][3]);
            } else {
              paramsDomainCients[0].push(' ');
              paramsDomainCients[1].push(' ');
            }
          }

          paramsDomainCients[2].push(domainClients[2][19], domainClients[2][24]);
          paramsDomainCients[3].push(domainClients[3][19], domainClients[3][20], domainClients[3][21]);
          paramsDomainCients[4] = m;

          values = await domainQuery(pool, 'dds_olga', paramsDomainCients);
          console.log(values.length);
          
          // let sellPayRangeD = list + '!' + colMonths[m][0] + START + ':' + colMonths[m][0] + (values[0][0].length + START);
          // let prePayRangeD = list + '!' + colMonths[m][1] + START + ':' + colMonths[m][1] + (values[0][0].length + START);
          // let addPayRangeD = list + '!' + colMonths[m][2] + START + ':' + colMonths[m][2] + (values[0][0].length + START);
          //
          // let sellPayRangeH = list + '!' + colMonths[m][3] + START + ':' + colMonths[m][3] + (values[0][0].length + START);
          // let prePayRangeH = list + '!' + colMonths[m][4] + START + ':' + colMonths[m][4] + (values[0][0].length + START);
          // let addPayRangeH = list + '!' + colMonths[m][5] + START + ':' + colMonths[m][5] + (values[0][0].length + START);


          // await Promise.all([
          //   crud.updateData(values[0][0], config.sid_2017.domain, sellPayRangeD),
          //   crud.updateData(values[0][1], config.sid_2017.domain, prePayRangeD),
          //   crud.updateData(values[0][2], config.sid_2017.domain, addPayRangeD),
          //   crud.updateData(values[1][0], config.sid_2017.domain, sellPayRangeH),
          //   crud.updateData(values[1][1], config.sid_2017.domain, prePayRangeH),
          //   crud.updateData(values[1][2], config.sid_2017.domain, addPayRangeH)
          // ])
          //   .then(async results => {console.log(results);})
          //   .catch(console.log);

        }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!B10';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = domain;
