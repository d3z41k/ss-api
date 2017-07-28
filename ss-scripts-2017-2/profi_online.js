'use strict';

const config = require('config');
const _ = require('lodash/array');

async function profiOnline() {
  return new Promise(async(resolve, reject) => {

    //-------------------------------------------------------------------------
    // Usres libs
    //-------------------------------------------------------------------------

    require('../libs/auth')(start);
    const Crud = require('../controllers/crud');
    //const formatDate = require('../libs/format-date');

    //---------------------------------------------------------------
    // Main function
    //---------------------------------------------------------------

    async function start(auth) {

      const crud = new Crud(auth);
      const START = {
        'dds': 6,
        'online': 2
      };
      const ARTICLES = [
        'Поступление от новых клиентов (продажа)',
        'Поступление денег от сущ.клиентов (предоплата)',
        'Поступление от сущ.клиентов (оконч. оплата)',
        'Деньги на контекст (от клиента)'
      ];

      let list = '';
      let range = '';
      let ddsDataReport = [];

      list = {
        'dds_lera': encodeURIComponent('ДДС_Лера'),
        'online': encodeURIComponent('Онлайн оплаты')
      };

      range = list.dds_lera + '!A' + START.dds + ':O';
      let ddsData = await crud.readData(config.sid_2017_2.dds, range);

      ddsData = ddsData.map(row => {
        return [
          row[0],
          row[6],
          row[9],
          row[5],
          row[10],
          row[11],
          row[12],
          row[13],
          row[14] ? row[14] : ''
        ];
      });

      try {

        for (let i = 0; i < ddsData.length; i++) {
          if (ARTICLES.includes(ddsData[i][2])
            && (ddsData[i][5] || ddsData[i][8])
            && ddsData[i][8] !== '39цветов.рф'
          ) {
            ddsDataReport.push(ddsData[i]);
          }
        }

      } catch (e) {
        reject(e.stack);
      }

      range = list.online + '!A' + START.online + ':J';
      let onlineData = await crud.readData(config.sid_2017_2.dds, range);

      let onlineDataNote = onlineData.filter(line => {
        return line[9] ? line : false;
      });

      onlineDataNote.forEach(lineOnline => {
        let note = lineOnline.splice(-1, 1);
        ddsDataReport.forEach((lineDds, i) => {
          if (!_.difference(lineDds, lineOnline).length) {
            ddsDataReport[i].push(note[0]);
          }
        });
      });

      let clear = [];

      for (let i = 0; i < 1500; i++) {
        clear.push([]);
        for (let j = 0; j < 10; j++) {
          clear[i].push('');
        }
      }

      range = list.online + '!A' + START.online + ':J';
      await crud.updateData(clear, config.sid_2017_2.dds, range)
      // .then(async results => {console.log(results);})
       .catch(console.log);

      await crud.updateData(ddsDataReport, config.sid_2017_2.dds, range)
      // .then(async results => {console.log(results);})
       .catch(console.log);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = profiOnline;
