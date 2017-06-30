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

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);

      let range = '';
      let valueHoursAll = [];
      const START = 10;
      const MONTHS = ['1', '2', '3', '4', '5' ,'6'];

      let list = {
        'hoursWorked': encodeURIComponent('Отработанные часы'),
        'listName': function(name) {
          return encodeURIComponent(name);
        }
      };

      range = list.hoursWorked + '!A3:A';
      let stuff = await crud.readData(config.sid_2017.lawt, range);

      stuff = stuff.map(employee => {
        return employee[0];
      });

      for (let e = 0; e < stuff.length; e++) {

        try {

          range = list.listName(stuff[e]) + '!A' + START + ':AB';
          let dataHoursRaw = await crud.readData(config.sid_2017.lawt, range);

          let dataHours = dataHoursRaw.map((row) => {
            return [row[2], row[27]];
          });



          //console.log(dataHours);
          let valueHours = [0, 0, 0, 0, 0, 0];

          dataHours.forEach(line => {
            if (MONTHS.includes(line[1])) {
              valueHours[line[1] - 1] += Number(line[0].replace(/\,/g, '.'));
            }
          });

          valueHoursAll.push(valueHours);

        } catch (e) {
          reject(e.stack);
        }

      } //end staff

      range = list.hoursWorked + '!B3:G';

      await crud.updateData(valueHoursAll, config.sid_2017.lawt, range)
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

module.exports = lawtHours;
