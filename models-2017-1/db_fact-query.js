async function factQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let sum = [];

    for (let i = 0; i < params[1].length; i++) {

      await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
          '`Месяц` = ? ' +
          'AND `Направление деятельноcти` = ? ' +
          'AND `Статья движения денег` = ?', [
            params[0][0],
            params[2][0],
            params[1][i][0] ? params[1][i][0].slice(1) : params[1][i][0] = 0
          ])
        .then(([col, feilds]) => {
          for (let key in col[0]) {
            sum.push([col[0][key] ? col[0][key] : 0]);
          }

        })
        .catch(err => {
          console.log(err)
        });
   }
    resolve(sum);
  });
}

module.exports = factQuery;
