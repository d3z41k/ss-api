'use strict';

const config = require('config');

async function dev() {
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
    const devQuery = require('../models/db_dev-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 6;

      let list = '';
      let range = '';

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AD';

      let dataDDS = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "srcRows" =
      //normLength(dataDDS);

       await dbRefresh(pool, 'dds_olga', dataDDS)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Get data from 'dev-registry'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (разработка)');
      range = list + '!A1:U';
      let devClients = await crud.readData(config.sid_2017.dev, range);

      //------------------------------------------------------------------------
      // Build paramsDevCients and get & update Pay & date in develop clients
      //------------------------------------------------------------------------

      let paramsDevCients = [[], [], [], []];

      try {

        //= Build params =
        for (let a = (START - 1); a < devClients.length; a++) {
          if (devClients[a][0] && devClients[a][1]) {
            paramsDevCients[0].push(devClients[a][0]);
            paramsDevCients[1].push(devClients[a][1]);

          } else {
            paramsDevCients[0].push(' ');
            paramsDevCients[1].push(' ');
          }
        }

        paramsDevCients[2].push(devClients[0][11].trim());
        paramsDevCients[3].push(devClients[1][11].trim(), devClients[1][15].trim(), devClients[1][19].trim());

        //= Get values =
        let values = await devQuery(pool, 'dds_olga', paramsDevCients);

        //= Update data =
        let sellPayRange = list + '!L' + START + ':M' + (values[0].length + START);
        let prePayRange = list + '!P' + START + ':Q' + (values[0].length + START);
        let finalPayRange = list + '!T' + START + ':U' + (values[0].length + START);

        await Promise.all([
          crud.updateData(values[0], config.sid_2017.dev, sellPayRange),
          crud.updateData(values[1], config.sid_2017.dev, prePayRange),
          crud.updateData(values[2], config.sid_2017.dev, finalPayRange)
        ])
          //.then(async results => {console.log(results);})
          .catch(console.log);

      } catch (e) {
        reject(e.stack);
      }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B4';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = dev;
