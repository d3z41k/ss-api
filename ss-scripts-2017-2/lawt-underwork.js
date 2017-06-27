'use strict';

const config = require('config');

async function lawtUnderwork() {
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

      let range = '';
      let valueUnderworkAll = [];
      const START = 10;

      let list = {
        'underwork': encodeURIComponent('Переработки'),
        'listName': function(name) {
          return encodeURIComponent(name);
        }
      };

      range = list.underwork + '!A2:A';
      let stuff = await crud.readData(config.sid_2017.lawt, range);

      stuff = stuff.map(employee => {
        return employee[0];
      });

      for (let e = 0; e < stuff.length; e++) {

        try {
          range = list.listName(stuff[e]) + '!A' + START + ':AD';
          let dataUnderworkRaw = await crud.readData(config.sid_2017.lawt, range);

          let dataUnderwork = dataUnderworkRaw.map((row) => {
            return [row[2], row[27], row[29]];
          });

          //console.log(dataUnderwork);
          let valueUnderwork = [0, 0, 0, 0, 0, 0];

          dataUnderwork.forEach(line => {
            if (line[2]) {
              valueUnderwork[line[1] - 1] += Number(line[0].replace(/\,/g, '.'));
            }
          });

          valueUnderworkAll.push(valueUnderwork);
        } catch (e) {
          reject(e.stack);
        }
      } //end staff

      range = list.underwork + '!B2:G';

      await crud.updateData(valueUnderworkAll, config.sid_2017.lawt, range)
        //.then(async result => {console.log(result);})
        .catch(console.err);

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!E31';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017.monit, range);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = lawtUnderwork;
