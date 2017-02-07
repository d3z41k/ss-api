'use strict';

const config = require('config');

async function extra() {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models-2017-1/db_pool');
    const extraQuery = require('../models/db_extra-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 5;

      let list = '';
      let range = '';

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AD';

      let dataDDS = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "dataDDS" =
      //normLength(dataDDS);

       await dbRefresh(pool, 'dds_olga', dataDDS)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Get data from 'dev-registry'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (доп.работы)');
      range = list + '!A1:U';
      let extraClients = await crud.readData(config.sid_2017.extra, range);

      //------------------------------------------------------------------------
      // Build paramsExtraCients and get & update Pay & date in extra clients
      //------------------------------------------------------------------------

      let paramsExtraCients = [[], [], [], []];

      try {

        //= Build params =
        for (let a = (START - 1); a < extraClients.length; a++) {
          if (extraClients[a][0] && extraClients[a][1]) {
            paramsExtraCients[0].push(extraClients[a][0]);
            paramsExtraCients[1].push(extraClients[a][1]);
          }
        }

        paramsExtraCients[2].push(extraClients[0][15]);
        paramsExtraCients[3].push(extraClients[1][15], extraClients[1][19]);

        //= Get values =
        let values = await extraQuery(pool, 'dds_olga', paramsExtraCients);

        //= Update data =
        let prePayRange = list + '!P' + START + ':Q' + (values[0].length + START);
        let addPayRange = list + '!T' + START + ':U' + (values[1].length + START);

        await Promise.all([
          crud.updateData(values[0], config.sid_2017.extra, prePayRange),
          crud.updateData(values[1], config.sid_2017.extra, addPayRange)
        ])
          //.then(async results => {console.log(results);})
          .catch(console.log);

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B3';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = extra;
