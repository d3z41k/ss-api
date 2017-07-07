'use strict';

const config = require('config');

async function lawtHours() {
  return new Promise(async (resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    const formatDate = require('../libs/format-date');
    const formatNumber = require('../libs/format-number');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let range = '';
      let valueHoursAll = [];
      const START = 10;
      const MONTHS = ['7', '8', '9', '10', '11', '12'];
      const MONTH_FACTOR = 7; // or 1 for first part of year

      let list = {
        'hoursWorked': encodeURIComponent('Отработанные часы'),
        'listName': function(name) {
          return encodeURIComponent(name);
        }
      };

      range = list.hoursWorked + '!A3:A';
      let stuff = await crud.readData(config.sid_2017_2.lawt, range);

      stuff = stuff.map(employee => {
        return employee[0];
      });

      for (let e = 0; e < stuff.length; e++) {

        //console.log(stuff[e]);

        try {

          range = list.listName(stuff[e]) + '!A' + START + ':AB';
          let dataHoursRaw = await crud.readData(config.sid_2017_2.lawt, range);

          let dataHours = dataHoursRaw.map((row) => {
            return [row[2], row[27]];
          });

          //console.log(dataHours);
          let valueHours = [0, 0, 0, 0, 0, 0];

          dataHours.forEach(line => {
            if (MONTHS.includes(line[1]) && line[0]) {
              valueHours[line[1] - MONTH_FACTOR] += formatNumber(line[0]);
            }
          });

          //console.log(valueHours);

          valueHoursAll.push(valueHours);

        } catch (e) {
          reject(e.stack);
        }

      } //end staff

      range = list.hoursWorked + '!B3:G';

      await crud.updateData(valueHoursAll, config.sid_2017_2.lawt, range)
        //.then(async result => {console.log(result);})
        .catch(console.err);

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      range = 'main!E31';

      let now = new Date();
      now = [[formatDate(now)]];

      await crud.updateData(now, config.sid_2017_2.monit, range);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = lawtHours;
