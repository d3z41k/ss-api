'use strict';

const config = require('config');
const _ = require('lodash/array');

async function finModelBalance() {
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
      const START = 7;

      let range = '';

      let list = {
        'indirectFact': encodeURIComponent('Косвенные (факт)'),
        'indirectPlan': encodeURIComponent('Косвенные (план)')
      };

      //------------------------------------------------------------------------
      // Get data from 'Indirect Fact 2016'
      //------------------------------------------------------------------------

      range = list.indirectFact + '!B' + START + ':EK';
      let indirectFactData = await crud.readData(config.ssId.indirect, range);

      //------------------------------------------------------------------------
      // Get data from 'Fin-model 2017'
      //------------------------------------------------------------------------

      range = list.indirectPlan + '!B' + START + ':D';
      let indirectPlanData = await crud.readData(config.sid_2017.fin_model, range);

      //------------------------------------------------------------------------
      // Main module
      //------------------------------------------------------------------------

      let balancePlanInfo = [];

      try {

        // = Prepair Balance 2016 =
        let balanceFactInfo = indirectFactData.map(row => {
          return [
            row[0], row[1], row[2],
            row[134] && Number(row[134].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
              ? Number(row[134].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0,
            row[135] && Number(row[135].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
              ? Number(row[135].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0,
            row[136] && Number(row[136].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
              ? Number(row[136].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0,
            row[137] && Number(row[137].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
              ? Number(row[137].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0,
            row[138] && Number(row[138].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
              ? Number(row[138].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0,
            row[139] && Number(row[139].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
              ? Number(row[139].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0,
          ];
        });

        indirectPlanData.forEach((plan, p)=> {
          balancePlanInfo.push([]);
          balanceFactInfo.forEach(fact => {
            let cutFact = [fact[0], fact[1], fact[2]];
            if (!_.difference(plan, cutFact)[0]) {
              balancePlanInfo[p].push(fact[3], fact[4], fact[5], fact[6], fact[7], fact[8]);
            } else if(cutFact[0] == 'АМО' && plan[0] == 'АМО (наша)') {
              balancePlanInfo[p].push(fact[3], fact[4], fact[5], fact[6], fact[7], fact[8]);
            } else if(cutFact[2] == 'Рассрочка за компьютер' && plan[2] == 'Рассрочка ') {
              balancePlanInfo[p].push(fact[3], fact[4], fact[5], fact[6], fact[7], fact[8]);
            } else if(cutFact[2] == 'Прочие выплаты' && plan[0] == 'Прочие выплаты' && plan[2] == 'Прочее') {
              balancePlanInfo[p].push(fact[3], fact[4], fact[5], fact[6], fact[7], fact[8]);
            } else if(cutFact[0] == 'Прочие поступления' && plan[0] == 'Прочие поступления' && plan[2] == 'Прочее') {
              balancePlanInfo[p].push(fact[3], fact[4], fact[5], fact[6], fact[7], fact[8]);
            }
          });
        });

        console.log(balancePlanInfo);


      range = list.indirectPlan + '!M' + START + ':R';

      await crud.updateData(balancePlanInfo, config.sid_2017.fin_model, range)
        .then(async results => {console.log(results);})
        .catch(console.log);

      //------------------------------------------------------------------------
      // Check Balance 2016 to 2017
      //------------------------------------------------------------------------

      range = list.indirectFact + '!EF1';
      let chekFact = await crud.readData(config.ssId.indirect, range);

      range = list.indirectPlan + '!M2';
      let chekPlan = await crud.readData(config.sid_2017.fin_model, range);

      chekFact = chekFact[0][0] && Number(chekFact[0][0].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
        ? Number(chekFact[0][0].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0;

      chekPlan = chekPlan[0][0] && Number(chekPlan[0][0].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,''))
        ? Number(chekPlan[0][0].replace(/\s/g, '').replace(/\(/g,'-').replace(/\)/g,'')) : 0;


      range = list.indirectPlan + '!M1';

      await crud.updateData([[chekFact - chekPlan]], config.sid_2017.fin_model, range)
        .then(async results => {console.log(results);})
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

module.exports = finModelBalance;
