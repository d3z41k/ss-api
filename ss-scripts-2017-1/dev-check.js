'use strict';

const config = require('config');

async function devCheck() {
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
      const ACTIVITIES = {
        'seo': 'SEO ',
        'admin': 'Административные задачи'
      };
      const START = {
        'row': 8,
        'col': 5
      };
      const DIRECTION = {
        'mts': 'МТС',
        'profi': 'Профи'
      };

      const colLawtDirections = config.colLawtDirections;

      let list = {
        'manual': encodeURIComponent('Справочник'),
        'listName': function(name) {
          return encodeURIComponent(name);
        }
      };

      function convertData(date) {
        const YEAR = 2017;
        if (date[0].length == 1) {
          date[0] = '0' + date[0];
        }
        if (date[1].length == 1) {
          date[1] = '0' + date[1];
        }
        return date[0] + '.' + date[1] + '.' + YEAR;
      }

      range = list.manual + '!D2:D';
      let seoStuff = await crud.readData(config.sid_2017.seo_lawt, range);

      seoStuff = seoStuff.map(employee => {
        return employee[0];
      });

//      seoStuff = ['Базеко Игорь'];

      for (let e = 0; e < seoStuff.length; e++) {

        range = list.listName(seoStuff[e]) + '!A2:FF1700';
        let dataSeo = await crud.readData(config.sid_2017.seo_lawt, range);

        let dataHours = [];
        let dataAdminHours = [];
        let counter = 0;


        for (let r = START.row; r < dataSeo.length; r++) {
          for (let c = START.col; c < dataSeo[r].length; c++) {
            if (dataSeo[r][c] && dataSeo[r][4] == 'факт') {
              dataHours.push([
                convertData([dataSeo[2][c], dataSeo[0][c]]),
                ACTIVITIES.seo,
                dataSeo[r][c]
              ]);
              let direction = dataSeo[r][1]
              for (let s = 0; s < colLawtDirections[direction]; s++) {
                dataHours[counter].push('');
              }
              dataHours[counter].push(dataSeo[r][0]);
              counter++;
            }
          }
        }

        for (let c = START.col; c < dataSeo[0].length; c++) {
          if (dataSeo[5][c]) {
            dataAdminHours.push([
              convertData([dataSeo[2][c], dataSeo[0][c]]),
              ACTIVITIES.admin,
              dataSeo[5][c],
              '',
              DIRECTION.mts
            ]);
          }
          if (dataSeo[6][c]) {
            dataAdminHours.push([
              convertData([dataSeo[2][c], dataSeo[0][c]]),
              ACTIVITIES.admin,
              Number(dataSeo[6][c]) * 0.5,
              '',
              DIRECTION.mts
            ]);
            dataAdminHours.push([
              convertData([dataSeo[2][c], dataSeo[0][c]]),
              ACTIVITIES.admin,
              Number(dataSeo[6][c]) * 0.5,
              '',
              DIRECTION.profi
            ]);
          }
        }

        dataHours = dataHours.concat(dataAdminHours);

        //console.log(dataHours);

        range = list.listName(seoStuff[e]) + '!A10:Z';

        await crud.updateData(dataHours, config.sid_2017.lawt, range)
          .then(async results => {console.log(results);})
          .catch(console.log);

      } //end Staff

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!B6';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017.monit, range);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = devCheck;
