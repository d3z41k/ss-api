'use strict';

const config = require('config');

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
      const START = 5;
      const ARTICLES = [
        'Поступление от новых клиентов (продажа)',
        'Поступление денег от сущ.клиентов (предоплата)',
        'Поступление от сущ.клиентов (оконч. оплата)',
        'Деньги на контекст (от клиента)'
      ];

      let list = '';
      let range = '';
      let range1 = '';
      let range2 = '';
      let ddsDataReport = [];
      let startRow = '';

      list = {
        'dds_lera': encodeURIComponent('ДДС_Лера'),
        'online': encodeURIComponent('Онлайн оплаты')
      };

      range = list.online + '!L1';
      let lastElement = await crud.readData(config.sid_2017_2.dds, range);
      lastElement = Number(lastElement[0][0]);

      range = list.online + '!D1:D';
      let onlineRow = await crud.readData(config.sid_2017_2.dds, range);
      startRow = onlineRow.length + 1;



      range = list.dds_lera + '!A1:O';
      let ddsData = await crud.readData(config.sid_2017_2.dds, range);


      ddsData = ddsData.map((row) => {
        return [row[0], row[6], row[9], row[5], row[10], row[11], row[12], row[13], row[14]];
      });

      try {

        for (let i = lastElement; i < ddsData.length; i++) {
          if (ARTICLES.includes(ddsData[i][2])
            && (ddsData[i][5] || ddsData[i][8])
            && ddsData[i][8] !== '39цветов.рф'
          ) {
            ddsDataReport.push(ddsData[i]);
          }
        }

        for (let i = START; i < ddsData.length; i++) {
          if (!ddsData[i][3]) {
            if (ddsData[i + 1] && !ddsData[i + 1][3]) {
              if (ddsData[i + 2] && !ddsData[i + 2][3]) {
                if (ddsData[i + 3] && !ddsData[i + 3][3]) {
                  if (ddsData[i + 4] && !ddsData[i + 4][3]) {
                    lastElement = i;
                    break;
                  }
                }
              }
            }
          }
        }

      //  console.log(lastElement);

      } catch (e) {
        reject(e.stack);
      }

      range1 = list.online + '!L1';
      range2 = list.online + '!A' + startRow + ':I';

      await Promise.all([
        crud.updateData([[lastElement]], config.sid_2017_2.dds, range1),
        crud.updateData(ddsDataReport, config.sid_2017_2.dds, range2)
      ])
       .then(async results => {console.log(results);})
       .catch(console.log);

    } // = End start function =

    resolve('complite!');

  });
}

module.exports = profiOnline;
