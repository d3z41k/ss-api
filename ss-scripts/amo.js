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
    const normLength = require('../libs/normalize-length');
    const dbRefresh = require('../models/db_refresh');
    const pool = require('../models/db_pool');
    const amoQuery = require('../models/db_amo-query');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const amoClientsStart = 5;

      let list = '';
      let range = '';

      //-------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-------------------------------------------------------------

      // list = encodeURIComponent('ДДС_Лера');
      // range = list + '!A6:AJ';
      //
      // let srcRows = await crud.readData(config.ssId.dds, range);
      //
      // // = Normalizing of length "srcRows" =
      // normLength(srcRows);
      //
      //  await dbRefresh(pool, 'dds_lera', srcRows)
      //   .then(async (result) => {console.log(result);})
      //   .catch(console.log);

      //-------------------------------------------------------------
      // Build params
      //-------------------------------------------------------------

      //------------------------------------------------------------------------
      // Get data from 'dev-registry'
      //------------------------------------------------------------------------

      list = encodeURIComponent('Клиенты (AMO)');
      range = list + '!B1:U';
      let amoClients = await crud.readData(config.ssId.dev_amo, range);

      let paramsAmoCients = [[], [], [], []];

      try {

        for (let a = amoClientsStart; a < amoClients.length; a++) {
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

        paramsAmoCients[3].push(amoClients[1][14], amoClients[1][18]);

      } catch (e) {
        console.log(e.stack);
      }

      //console.log(paramsAmoCients[0][1]);

      let values = await amoQuery(pool, 'dds_lera', paramsAmoCients);

      console.log(values);


      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      // if (mode) {
      //   range = 'sheet1!C11';
      // } else {
      //   range = 'sheet1!B11';
      // }
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.ssId.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = amo;
