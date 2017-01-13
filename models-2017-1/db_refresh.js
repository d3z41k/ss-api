'use strict';

const config = require('config');

// Need to expand!!!

async function dbRefresh(pool, tableName, srcRows) {
  return new Promise(async(resolve, reject) => {

    await pool.query("TRUNCATE TABLE " + tableName)
      .then(() => {
        console.log('table ' + tableName + ' truncate - OK!')
      })
      .catch(err => {
        reject(err)
      });

    for (let i = 0; i < srcRows.length; i++) {
      //-----------------------------------------------------------------------------
      // Adaptation of values "Sum"
      //-----------------------------------------------------------------------------

      srcRows[i].length = config.dds_width[2017][tableName];

      if (srcRows[i][5]) {
        if (srcRows[i][5] && srcRows[i][5][0] == '(' && srcRows[i][5][srcRows[i][5].length - 1] == ')') {
          srcRows[i][5] = srcRows[i][5].slice(1).slice(0, -1);
          srcRows[i][5] = '-' + srcRows[i][5]
        }
        srcRows[i][5] = Number(srcRows[i][5].replace(/\s/g, ''));
      }

      if (srcRows[i][21] && srcRows[i][21].includes('→')) {
        srcRows[i][21] = srcRows[i][21].slice(2).trim();
      }

      if (srcRows[i][29] && srcRows[i][29].includes('→')) {
        srcRows[i][29] = srcRows[i][29].slice(2).trim();
      }

      //------------------------------------------------------------------------------

      await pool.query("INSERT INTO " + tableName + " VALUES (NULL, '" + srcRows[i].join('\', \'') + "')")
        .catch(err => {
          reject(err)
        });

    }

    resolve('table ' + tableName + ' refreshed!');

  });
}

module.exports = dbRefresh;
