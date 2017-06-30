'use strict';

const config = require('config');

async function ddsDirectory() {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const RANGE = '!V3:BL';

      let dds_directory = config.dds_directory;

      let range = '';
      let list = {
        'directory': encodeURIComponent('Спр'),
        'listEncode': sheet => {
          return encodeURIComponent(sheet);
        }
      };

      try {

      // = Get Profi1 =

      for (let i = 0; i < dds_directory.profi1.length; i++) {
        range = list.listEncode(dds_directory.profi1[i]) + dds_directory.profi;
        let resultDirectory = await crud.readData(config.sid_2017_2.profi1, range);

      }

      console.log(resultDirectory);

      // = Ggt Profi2 =


      } catch (e) {
        reject(e.stack);
      }


      // range = list.underwork + '!B2:G';
      //
      // await crud.updateData(valueUnderworkAll, config.sid_2017.lawt, range)
      //   //.then(async result => {console.log(result);})
      //   .catch(console.err);

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!B18';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = ddsDirectory;
