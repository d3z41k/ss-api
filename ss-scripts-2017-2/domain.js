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
    const dbRefresh = require('../models-2017-2/db_refresh');
    const pool = require('../models-2017-2/db_pool');
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
      const colMonths = config.domain_colMonths_2017;

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AD';

      let srcRows = await crud.readData(config.sid_2017_2.dds, range);

      //= Normalizing of length "srcRows" (not actual) =
      //normLength(srcRows);

       await dbRefresh(pool, 'dds_olga', srcRows)
        //.then(async (result) => {console.log(result);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Get data from 'domain-registry'
      //------------------------------------------------------------------------

      list = encodeURIComponent('ДХ(реестр)');
      range = list + '!A1:AA';
      let domainClients = await crud.readData(config.sid_2017_2.domain, range);

      //------------------------------------------------------------------------
      // Build paramsDomainCients and get & update Pay & date in domain clients
      //------------------------------------------------------------------------

      for (let m = MONTHS[0]; m <= MONTHS[MONTHS.length - 1]; m++) {

        let paramsDomainCients = [[], [], [], [], []];

        try {

          //= Build params =
          for (let a = (START - 1); a < domainClients.length; a++) {
            if (domainClients[a][2] && domainClients[a][3]) {
              paramsDomainCients[0].push(domainClients[a][2]); //site
              paramsDomainCients[1].push(domainClients[a][3]); //counterparty
            } else {
              paramsDomainCients[0].push(' ');
              paramsDomainCients[1].push(' ');
            }
          }

          paramsDomainCients[2].push(domainClients[2][19], domainClients[2][24]); //direction (domain & hosting)
          paramsDomainCients[3].push(domainClients[3][19], domainClients[3][20], domainClients[3][21]); // articles
          paramsDomainCients[4] = m; //month

          //= Get values =
          let values = await domainQuery(pool, 'dds_olga', paramsDomainCients);

          //= Update data =
          let sellPayRangeD = list + '!' + colMonths[m][0] + START + ':' + colMonths[m][0] + (values[0][0].length + START);
          let prePayRangeD = list + '!' + colMonths[m][1] + START + ':' + colMonths[m][1] + (values[0][0].length + START);
          let addPayRangeD = list + '!' + colMonths[m][2] + START + ':' + colMonths[m][2] + (values[0][0].length + START);

          let sellPayRangeH = list + '!' + colMonths[m][3] + START + ':' + colMonths[m][3] + (values[0][0].length + START);
          let prePayRangeH = list + '!' + colMonths[m][4] + START + ':' + colMonths[m][4] + (values[0][0].length + START);
          let addPayRangeH = list + '!' + colMonths[m][5] + START + ':' + colMonths[m][5] + (values[0][0].length + START);


          await Promise.all([
            crud.updateData(values[0][0], config.sid_2017_2.domain, sellPayRangeD),
            crud.updateData(values[0][1], config.sid_2017_2.domain, prePayRangeD),
            crud.updateData(values[0][2], config.sid_2017_2.domain, addPayRangeD),
            crud.updateData(values[1][0], config.sid_2017_2.domain, sellPayRangeH),
            crud.updateData(values[1][1], config.sid_2017_2.domain, prePayRangeH),
            crud.updateData(values[1][2], config.sid_2017_2.domain, addPayRangeH)
          ])
            //.then(async results => {console.log(results);})
            .catch(console.log);



        } catch (e) {
          reject(e.stack);
        }

      }

      //-------------------------------------------------------------
      // Debt 2017_1 to 2017
      //-------------------------------------------------------------

      list = encodeURIComponent('ДХ(реестр)');
      range = list + '!A6:CA';

      let regData2017_1raw = await crud.readData(config.sid_2017.domain, range);

      let regData2017_1 = regData2017_1raw.map((row) => {
        if (row[77].trim() != '-' || row[78].trim() != '-') {
          return [
            row[2], row[77], row[78]
          ];
        } else {
          return [];
        }
      });

      regData2017_1 = regData2017_1.filter(val => {
        if (val[0]) {
          return val;
        }
      });

      //console.log(regData2017_1);

      range = list + '!C7:C';

      let regData2017 = await crud.readData(config.sid_2017_2.domain, range);

      //console.log(regData2017raw);

      let debtData2017_1 = [];

      regData2017.forEach((project2017, p) => {
        debtData2017_1.push([]);
        regData2017_1.forEach(project2017_1 => {
          if (project2017[0] == project2017_1[0]) {
            debtData2017_1[p].push(project2017_1[1], project2017_1[2]);
          }
        });
      });

      range = list + '!P7:Q';

      await crud.updateData(debtData2017_1, config.sid_2017_2.domain, range)
        .then(async results => {console.log(results);})
        .catch(console.log);


      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B10';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017_2.monit, range);

      //resolve('complite!');

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = domain;
