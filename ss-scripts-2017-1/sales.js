'use strict';

const config = require('config');

async function sales() {
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
    const salesQuery = require('../models/db_sales-query');

    //-------------------------------------------------------------------------
    // Main function
    //-------------------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 16;

      let list = '';
      let range = '';

      //-----------------------------------------------------------------------
      // Read data from DDS and refresh DB
      //-----------------------------------------------------------------------

      list = encodeURIComponent('ДДС_Ольга');
      range = list + '!A6:AD';

      let dataDDS = await crud.readData(config.sid_2017.dds, range);

      // = Normalizing of length "srcRows" =
      //normLength(dataDDS);

       await dbRefresh(pool, 'dds_olga', dataDDS)
        .then(async (result) => {console.log(result);})
        .catch(console.log);

      //-----------------------------------------------------------------------
      // Get data from 'dev-registry'
      //-----------------------------------------------------------------------

      list = encodeURIComponent('Продажи');
      range = list + '!A1:M';
      let salesClients = await crud.readData(config.sid_2017.sales, range);

      //-----------------------------------------------------------------------
      // Build paramsSalesCients and get & update Pay & date in sales clients
      //-----------------------------------------------------------------------

      let paramsSalesCients = [[], [], [], []];

      try {

        for (let a = (START - 1); a < salesClients.length; a++) {

          if (salesClients[a][0] && salesClients[a][1]) {
            paramsSalesCients[0].push(salesClients[a][0]);
            paramsSalesCients[1].push(salesClients[a][1]);
            paramsSalesCients[2].push(salesClients[a][2]);

          } else {
            paramsSalesCients[0].push(' ');
            paramsSalesCients[1].push(' ');
            paramsSalesCients[2].push(' ');
          }
        }

        paramsSalesCients[3].push(salesClients[3][11].trim());

      } catch (e) {
        reject(e.stack);
      } finally {

        //console.log(paramsSalesCients);

      let values = await salesQuery(pool, 'dds_olga', paramsSalesCients);

      //console.log(values);

      let sellPayRange = list + '!L' + START + ':M' + (values.length + START);

      await crud.updateData(values, config.sid_2017.sales, sellPayRange)
        .then(async results => {console.log(results);})
        .catch(console.log);

      }

      //-----------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-----------------------------------------------------------------------

      range = 'main!B2';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = sales;
