'use strict';

const config = require('config');

async function ddsReplication() {
  return new Promise(async (resolve, reject) => {

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const pool = require('../models-2017-2/db_pool');
    const dbRefresh = require('../models-2017-2/db_refresh');
    const formatDate = require('../libs/format-date');

    async function start(auth) {

      const crud = new Crud(auth);

      let range = {
        'lera': '!A6:V',
        'olga': '!A6:AD'
      };

      let list = {
        'lera' : encodeURIComponent('ДДС_Лера'),
        'olga' : encodeURIComponent('ДДС_Ольга')
      };

      let ddsData = {
        'lera': '',
        'olga': ''
      };

      let range1 = list.lera + range.lera;
      let range2 = list.olga + range.olga;

      try {

        await Promise.all([
          crud.readData(config.sid_2017_2.dds, range1),
          crud.readData(config.sid_2017_2.dds, range2)
        ])
         .then(async ([dds_lera, dds_olga]) => {
            ddsData.lera = dds_lera;
            ddsData.olga = dds_olga;
          })
          .catch(console.log);

        //------------------------------------------------------------------------
        // Refresh table
        //------------------------------------------------------------------------

        await Promise.all([
          dbRefresh(pool, 'dds_lera', ddsData.lera),
          dbRefresh(pool, 'dds_olga', ddsData.olga)
        ])
          .then(async (results) => {console.log(results);})
          .catch(console.log);


      } catch (e) {
        reject(e.stack);
      }

      range = 'main!E18';

      let now = new Date();
      now = [[formatDate(now)]];
      await crud.updateData(now, config.sid_2017_2.monit, range);

      resolve('complite!');

  } // = End start function =

});
}

module.exports = ddsReplication;
