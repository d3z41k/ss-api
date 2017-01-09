'use strict';

const config = require('config');

async function amo() {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    //const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models-2017-1/db_refresh');
    const pool = require('../models/db_pool');
    const amoQuery = require('../models/db_amo-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 12;

      let list = '';
      let range = '';

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      list = encodeURIComponent('ДДС_Лера');
      range = list + '!A6:V';
      let srcRows = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "srcRows" =
      //normLength(srcRows);

       await dbRefresh(pool, 'dds_lera', srcRows)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Get data from 'dev-registry'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (AMO)');
      range = list + '!B1:U';
      let amoClients = await crud.readData(config.sid_2017.amo, range);

      //------------------------------------------------------------------------
      // Build paramsAmoCients and get & update Pay & date in amo clients
      //------------------------------------------------------------------------

      let paramsAmoCients = [[], [], [], []];

      for (let a = (START - 1); a < amoClients.length; a++) {
        if (amoClients[a][0] && amoClients[a][1] && amoClients[a][3]) {
          paramsAmoCients[0].push(amoClients[a][0]);
          paramsAmoCients[1].push(amoClients[a][1]);
          paramsAmoCients[2].push(amoClients[a][3]);
        } else {
          paramsAmoCients[0].push(' ');
          paramsAmoCients[1].push(' ');
          paramsAmoCients[2].push(' ');
        }
      }

      paramsAmoCients[3].push(amoClients[8][14], amoClients[8][18]);

      //console.log(paramsAmoCients);

      let values = await amoQuery(pool, 'dds_lera', paramsAmoCients);

      let prePayRange = list + '!P' + START + ':Q' + (values[0].length + START);
      let addPayRange = list + '!T' + START + ':U' + (values[1].length + START);

      console.log(values);

      await Promise.all([
        crud.updateData(values[0], config.sid_2017.amo, prePayRange),
        crud.updateData(values[1], config.sid_2017.amo, addPayRange)
      ])
        .then(async results => {console.log(results);})
        .catch(console.log);


      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!B9';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017.monit, range);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = amo;
