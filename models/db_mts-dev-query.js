async function mtsDevQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let value = [];

    for (let i = 0; i < 2; i++) {

      await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
          '`Направление деятельноcти` = ? ' +
          'AND `Статья движения денег` = ? ' +
          'AND `Месяц` = ? ' +
          'AND `Проекты разработка` = ? ' +
          'AND `Контрагент Разработка` = ?', [
            params[0][0],
            params[1][i][0],
            params[2][0],
            params[3][0],
            params[4][0]
          ])
        .then(([col, feilds]) => {
          for (let key in col[0]) {
            value.push(col[0][key] ? col[0][key] : 0);
          }
        })
        .catch(err => {
          console.log(err)
        });
   }
    resolve([value]);
  });
}

module.exports = mtsDevQuery;
