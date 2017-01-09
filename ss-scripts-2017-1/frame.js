'use strict';

const config = require('config');

async function func() {
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

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let list = '';
      let range = '';

      //-------------------------------------------------------------
      //
      //-------------------------------------------------------------

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

      //resolve('complite!');

    } // = End start function =


  });
}

module.exports = func;
