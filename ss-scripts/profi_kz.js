'use strict';

const config = require('config');

async function profi_kz() {
    return new Promise(async(resolve, reject) => {

        //-------------------------------------------------------------------------
        // Usres libs
        //-------------------------------------------------------------------------

        require('../libs/auth')(start);
        const Crud = require('../controllers/crud');
        const formatDate = require('../libs/format-date');
        //const normLength = require('../libs/normalize-length');
        const dbRefresh = require('../models/db_refresh');
        const pool = require('../models/db_pool');
        const profiKZQuery = require('../models/db_profi_kz-query');

        //---------------------------------------------------------------
        // Main function
        //---------------------------------------------------------------

        async function start(auth) {

            const crud = new Crud(auth);
            const START = 'D15';
            const END = 'I16';

            let list = '';
            let range = '';
            let range1 = '';
            let range2 = '';
            let dataDDS = {
                lera: '',
                olga: ''
            };

            //-------------------------------------------------------------
            // Read data from dds_lera to RAM
            //-------------------------------------------------------------

            list = encodeURIComponent('ДДС_Лера');
            range1 = list + '!A6:AC';

            list = encodeURIComponent('ДДС_Ольга');
            range2 = list + '!A6:AK';

            await Promise.all([
                crud.readData(config.ssId.dds, range1),
                crud.readData(config.ssId.dds, range2)
            ]).then(async([dds_lera, dds_olga]) => {
                dataDDS.lera = dds_lera;
                dataDDS.olga = dds_olga;
            }).catch(console.log);

            //---------------------------------------------------------------
            // Refresh table
            //---------------------------------------------------------------

            await Promise.all([
                dbRefresh(pool, 'dds_lera', dataDDS.lera),
                dbRefresh(pool, 'dds_olga', dataDDS.olga)
            ])
            //.then(async (results) => {console.log(results);})
                .catch(console.log);

            //------------------------------------------------------------------------
            // Build paramsProfiKZ and get & update
            //------------------------------------------------------------------------

            let paramsProfiKZ = [
                [], [], []
            ];
            let values = [];
            let sum1;
            let sum2;

            try {

                //= Build params =

                paramsProfiKZ[0] = [
                    '7',
                    '8',
                    '9',
                    '10',
                    '11',
                    '12'
                ];
                paramsProfiKZ[1] = ['Готовый сайт (профи)'];
                paramsProfiKZ[2] = ['Поступление денег от клиентов (предоплата)', 'Поступление от клиентов (оконч. оплата)'];

                //= Get values =
                await Promise.all([
                    profiKZQuery(pool, 'dds_lera', paramsProfiKZ),
                    profiKZQuery(pool, 'dds_olga', paramsProfiKZ)
                ]).then(async([s1, s2]) => {
                    sum1 = s1;
                    sum2 = s2;
                }).catch(console.log);

                for (let a = 0; a < sum1.length; a++) {
                    values.push([]);
                    for (let m = 0; m < sum1[a].length; m++) {
                        values[a].push(Number(sum1[a][m]) + Number(sum2[a][m]));
                    }
                }

                list = encodeURIComponent('Результаты');
                range = list + '!' + START + ':' + END;

                await crud.updateData(values, config.ssId.profi_kz, range)
                //   .then(async results => {console.log(results);})
                    .catch(console.log);

            } catch (e) {
                reject(e.stack);
            }

            //------------------------------------------------------------------------
            // Update date-time in "Monitoring"
            //------------------------------------------------------------------------

            // range = 'main!B9';
            //
            // let now = new Date();
            // now = [[formatDate(now)]];
            //
            // await crud.updateData(now, config.sid_2017.monit, range);

        } // = End start function =

        resolve('complite!');

    });
}

module.exports = profi_kz;
