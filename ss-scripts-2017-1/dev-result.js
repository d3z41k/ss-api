'use strict';

const config = require('config');

async function dev() {
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
      const START = 6;

      let range = '';
      let list = {
        'registry': encodeURIComponent('Разработка (реестр)'),
        'clients': encodeURIComponent('Клиенты (разработка)'),
        'result': encodeURIComponent('(Юра) итог2')
      };

      //------------------------------------------------------------------------
      // Get data from 'clientsData'
      //------------------------------------------------------------------------

      range = list.clients + '!A' + START + ':J';
      let clientsData = await crud.readData(config.sid_2017.dev, range);

      //------------------------------------------------------------------------
      // Get data from 'registryData'
      //------------------------------------------------------------------------

      range = list.registry + '!C' + START + ':L';
      let registryData = await crud.readData(config.sid_2017.dev, range);

      //------------------------------------------------------------------------
      // Get data from 'registryData'
      //------------------------------------------------------------------------

      range = list.result + '!B4:H';
      let devResultData = await crud.readData(config.sid_2017.dev_result, range);

      try {

        let clientsInfo = clientsData.map(row => {
          return [
            row[0],
            row[9] && Number(row[9].replace(/\s/g, ''))
            ? Number(row[9].replace(/\s/g, '')) : 0
          ];
        });

        let registryInfo = registryData.map(row => {
          return [
            row[0], row[5], row[7], row[9]
          ]
        });

        let devResultInfo = devResultData.map(row => {
          return [
            row[0], row[6]
          ]
        });

        let projects = [];
        let sumCintract = [];

        devResultInfo.forEach((project, p) => {
          console.log(devResultInfo[p][1]);
          if (project[0] && !projects.includes(project[0])) {
            projects.push(project[0]);
          }
        });

        projects.forEach((project, i) => {
          if (clientsInfo[i][0] == project) {
            sumCintract.push([clientsInfo[i][1]]);
            for (let j = 0; j < 8; j++) {
              sumCintract.push([]);
            }
          }
        });

        //console.log(sumCintract);
        // range = list.result + '!E4:E';
        // await crud.updateData(sumCintract, config.sid_2017.dev_result, range)
        //   .then(async results => {console.log(results);})
        //   .catch(console.log);

      } catch (e) {
        reject(e.stack);
      }

      // //------------------------------------------------------------------------
      // // Build paramsDevCients and get & update Pay & date in develop clients
      // //------------------------------------------------------------------------
      //
      // let paramsDevCients = [[], [], [], []];
      //
      // try {
      //
      //   //= Build params =
      //   for (let a = (START - 1); a < devClients.length; a++) {
      //     if (devClients[a][0] && devClients[a][1]) {
      //       paramsDevCients[0].push(devClients[a][0]);
      //       paramsDevCients[1].push(devClients[a][1]);
      //
      //     } else {
      //       paramsDevCients[0].push(' ');
      //       paramsDevCients[1].push(' ');
      //     }
      //   }
      //
      //   paramsDevCients[2].push(devClients[0][11].trim());
      //   paramsDevCients[3].push(devClients[1][11].trim(), devClients[1][15].trim(), devClients[1][19].trim());
      //
      //   //= Get values =
      //   let values = await devQuery(pool, 'dds_olga', paramsDevCients);
      //
      //   //= Update data =
      //   let sellPayRange = list + '!L' + START + ':M' + (values[0].length + START);
      //   let prePayRange = list + '!P' + START + ':Q' + (values[0].length + START);
      //   let finalPayRange = list + '!T' + START + ':U' + (values[0].length + START);
      //
      //   await Promise.all([
      //     crud.updateData(values[0], config.sid_2017.dev, sellPayRange),
      //     crud.updateData(values[1], config.sid_2017.dev, prePayRange),
      //     crud.updateData(values[2], config.sid_2017.dev, finalPayRange)
      //   ])
      //     //.then(async results => {console.log(results);})
      //     .catch(console.log);
      //
      // } catch (e) {
      //   reject(e.stack);
      // }

      //------------------------------------------------------------------------
      // Update date-time in "Monitoring"
      //------------------------------------------------------------------------

      // range = 'main!B4';
      //
      // let now = new Date();
      // now = [[formatDate(now)]];
      //
      // await crud.updateData(now, config.sid_2017.monit, range);

      resolve('complite!');

    } // = End start function =

  });
}

module.exports = dev;
