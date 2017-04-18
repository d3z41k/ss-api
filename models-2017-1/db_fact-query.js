async function factQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let sum = [];

    try {

      for (let m = 0; m < params[0].length; m++) {
        sum.push([]);
        for (let d = 0; d < params[2].length; d++) {
          sum[m].push([]);
          for (let sd = 0; sd < params[2][d].length; sd++) {
            sum[m][d].push([]);
            for (let i = 0; i < params[1].length; i++) {

              await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Направление деятельноcти` = ? ' +
                  'AND `Статья движения денег` = ?', [
                    params[0][m],
                    params[2][d][sd],
                    params[1][i][0] ? params[1][i][0].trim() : params[1][i][0] = 0
                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[m][d][sd].push([col[0][key] ? col[0][key] : 0]);
                  }

                })
                .catch(err => {
                  console.log(err)
                });
              }
            }
         }
      }

    } catch (e) {
      reject(e.stack);
    }

    resolve(sum);

  });
}

module.exports = factQuery;
