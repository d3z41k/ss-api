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

    //-------------------------------------------------------------------------
    // Main function
    //-------------------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = 6;
      const START_RESULT = 4;
      const CREW = 8;

      let range = '';
      let range1 = '';
      let range2 = '';
      let range3 = '';

      let list = {
        'registry': encodeURIComponent('Разработка (реестр)'),
        'clients': encodeURIComponent('Клиенты (разработка)'),
        'result': encodeURIComponent('Себестоимость проектов')
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

      range = list.result + '!B' + START_RESULT + ':H';
      let devResultData = await crud.readData(config.sid_2017.dev, range);

      //------------------------------------------------------------------------
      // Main module
      //------------------------------------------------------------------------

      let projects = [];
      let sumContract = [];
      let endMonth = [];
      let crewProject = {};
      let hoursProject = {};
      let normaFactHours = [];
      let normaFactHoursPrep = [];

      try {

        // = Prepair Info from a spreadsheets =
        let clientsInfo = clientsData.map(row => {
          return [
            row[0],
            row[9] && Number(row[9].replace(/\s/g, ''))
            ? Number(row[9].replace(/\s/g, '')) : 0
          ];
        });

        let registryInfo = registryData.map(row => {
          return [
            row[0], row[5], row[7], row[8], row[9]
          ]
        });

        let devResultInfo = devResultData.map(row => {
          return [
            row[0], row[6]
          ]
        });

        // = Fetch data =
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
              hoursProject[project].push([registryInfo[j][2], registryInfo[j][3], registryInfo[j][4]]);
            }
          }
        });

        projects.forEach((project, p) => {
          normaFactHours.push([]);
          crewProject[project].forEach(employee => {
            if (!employee) {
                normaFactHours[p].push([0, 0]);
            }
            hoursProject[project].forEach(hours => {
              if (employee == hours[0]) {
                normaFactHours[p].push([hours[1], hours[2]]);
              }
            });
          });
        });

        normaFactHours.forEach(project => {
          project.push([]);
          normaFactHoursPrep = normaFactHoursPrep.concat(project);
        });

        projects.forEach(project => {
          for (let i = 0; i < clientsInfo.length; i++) {
            if (clientsInfo[i][0] == project) {
              sumContract.push([clientsInfo[i][1]]);
              for (let j = 0; j < CREW; j++) {
                sumContract.push([]);
              }
            }
          }
          let new_project = true;
          for (let n = 0; n < registryInfo.length; n++) {
            if (registryInfo[n][0] == project && new_project) {
              endMonth.push([registryInfo[n][1]]);
              for (let m = 0; m < CREW; m++) {
                endMonth.push([]);
              }
              new_project = false;
            }
          }

        });

        // = Update data =
        range1 = list.result + '!E' + START_RESULT + ':E';
        range2 = list.result + '!L' + START_RESULT + ':M';
        range3 = list.result + '!G' + START_RESULT + ':G';

        await Promise.all([
            crud.updateData(sumContract, config.sid_2017.dev, range1),
            crud.updateData(normaFactHoursPrep, config.sid_2017.dev, range2),
            crud.updateData(endMonth, config.sid_2017.dev, range3)
        ])
        //  .then(async results => {console.log(results);})
          .catch(console.log);

      } catch (e) {
        reject(e.stack);
      }

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
