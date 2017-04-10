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
      let range1 = '';
      let range2 = '';
      let range3 = '';

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

      let projects = [];
      let sumContract = [];
      let endMonth = [];
      let crewProject = {};
      let hoursProject = {};
      let factHours = [];
      let factHoursPrep = [];

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

        devResultInfo.forEach(project => {
          if (project[0] && !projects.includes(project[0])) {
            projects.push(project[0]);
          }
        });

        projects.forEach(project => {
          crewProject[project] = [];
          hoursProject[project] = [];

          for (let i = 0; i < devResultInfo.length; i++) {
            if (devResultInfo[i][0] == project) {
              crewProject[project].push(devResultInfo[i][1]);
            }
          }

          for (let j = 0; j < registryInfo.length; j++) {
            if (registryInfo[j][0] == project) {
              hoursProject[project].push([registryInfo[j][2], registryInfo[j][3]]);
            }
          }
        });

        projects.forEach((project, p) => {
          factHours.push([]);
          crewProject[project].forEach(employee => {
            if (!employee) {
                factHours[p].push([0]);
            }
            hoursProject[project].forEach(hours => {
              if (employee == hours[0]) {
                factHours[p].push([hours[1]]);
              }
            });
          });
        });

        factHours.forEach(project => {
          project.push([]);
          factHoursPrep = factHoursPrep.concat(project);
        });

        projects.forEach(project => {
          for (let i = 0; i < clientsInfo.length; i++) {
            if (clientsInfo[i][0] == project) {
              sumContract.push([clientsInfo[i][1]]);
              for (let j = 0; j < 8; j++) {
                sumContract.push([]);
              }
            }
          }
          let new_project = true;
          for (let n = 0; n < registryInfo.length; n++) {
            if (registryInfo[n][0] == project && new_project) {
              endMonth.push([registryInfo[n][1]]);
              for (let m = 0; m < 8; m++) {
                endMonth.push([]);
              }
              new_project = false;
            }
          }

        });

        range1 = list.result + '!E4:E';
        range2 = list.result + '!L4:L';
        range3 = list.result + '!G4:G';

        await Promise.all([
            crud.updateData(sumContract, config.sid_2017.dev_result, range1),
            crud.updateData(factHoursPrep, config.sid_2017.dev_result, range2),
            crud.updateData(endMonth, config.sid_2017.dev_result, range3)
        ])
          .then(async results => {console.log(results);})
          .catch(console.log);

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
