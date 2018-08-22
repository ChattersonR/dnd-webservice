//Reference http://wern-ancheta.com/blog/2015/04/26/getting-started-with-couchdb-in-node-dot-js/
var uuid = require('uuid/v1')
var aws = require('aws-sdk');
aws.config.sslEnabled = false

//var dynamo = new aws.DynamoDB({apiVersion: '2012-08-10',
var ddb = new aws.DynamoDB.DocumentClient({apiVersion: '2012-08-10', endpoint: 'http://dynamodb.us-east-2.amazonaws.com'});

var characterDb = 'characterDb';

function parseDamageString(damageString) {
    console.log("Parsing damageString: " + damageString);
    var damageArray = damageString.split('d+');
    var damageReturn = {};
    damageReturn.count = damageArray[0];
    damageReturn.faces = damageArray[1];
    damageReturn.bonus = damageArray[2];
    return damageReturn;
}

function parseClassLevelString(classLevelString){
  if(classLevelString.endsWith(", ")) {
    classLevelString =
      classLevelString.substring(0, classLevelString.lastIndexOf(", "));
  }

  console.log("Parsing classLevelString: " + classLevelString);
  var classLevelStringArray = classLevelString.split(/[, ]+/);
  var returnArray = [];
  classLevelStringArray.forEach(function(element){
    var classLevel = {};
    var splitArray = element.split(':');
    if(splitArray[0]) classLevel.className = splitArray[0];
    if(splitArray[1]) classLevel.level = splitArray[1];
    returnArray.push(classLevel);
  });
  return returnArray;
}

module.exports={
  getCharacterList: function (callback) {
    var params = {
        TableName: 'characterDb',
        AttributesToGet: ['characterName', 'characterInfo']
    };

    ddb.scan(params, function(err, body){
      if(!err){
        var returnObject = { 'names':[] };
        body.Items.forEach(function(element, index, array){
          returnObject.names.push({name: element.characterInfo.characterName, uuid: element.characterName});
        });
        callback(returnObject);
      } else {
        console.error("getCharacterList error: " + err)
        throw err;
      }
    });
  },

  getCharacterRecord: function (uuid, callback) {
    console.log("Retrieving character data for: " + uuid);
    var params = {
        TableName: 'characterDb',
        Key: {
            'characterName' : uuid
        }
    };
    ddb.get(params, function(err, body){
      if(!err){
        console.log("getCharacter response: " + body.Item.characterName)
        var characterData = body.Item;
        characterData.uuid = characterData.characterName
        callback(characterData);
      } else {
        console.error("getCharacterRecord error: " + err)
        throw err;
      }
    });
  },

  createNewCharacter: function(characterName, callback) {
    console.log("Creating new character: " + characterName  )

    var uniqueId = uuid()
    var params = {
            TableName: 'characterDb',
            Item: {
                'characterName' : uniqueId,
                'characterInfo' : {
                    'characterName' : characterName
                }
            }
        };

    ddb.put(params, function(err, body){
      if(!err){
        callback(uniqueId);
        //callback(body.rows[0].doc);
        //Do nothing?
      } else {
        throw err;
      }
    });
  },

  updateCharacter: function(uuid, characterName, classLevelString, race,
    background, alignment, experience, playerName,
    strength, strengthMod, dex, dexMod, con, conMod,
    int, intMod, wis, wisMod, cha, chaMod, armorClass,
    initiative, speed, maxHp, currentHp, tempHp,
    totalHitDie, currentHitDie, /*death success, deathFailure,*/
    strSave, dexSave, conSave, intSave, wisSave, chaSave,
    inspiration, proficiencyBonus, perception,
    weaponList, attackBonusList, damageStringList,
    newWeapon, newAttackBonus, newDamageString,
    personalityTraits, ideals, flaws, bonds,
    inventory,
    callback)
    {

      var attackList = [];
      if(weaponList) {
          for(i = 0; i < weaponList.length; i++) {
            var damageInfo = parseDamageString(damageStringList[i]);
            attackList.push({
              'weaponName': weaponList[i],
              'attackBonus': attackBonusList[i],
              'attackDamageType': { 'faces': damageInfo.faces, 'count': damageInfo.count},
              'attackDamageBonus': damageInfo.bonus
            });
          }
     }

      if((!newWeapon === undefined && !newWeapon === "") ||
         (!newAttackBonus === undefined && !newAttackBonus === "") ||
         (!newDamageString === undefined && !newDamageString === ""))
      {
        var newDamageInfo = parseDamageString(newDamageString);
        attackList.push({
          'weaponName': newWeapon,
          'attackBonus': newAttackBonus,
          'attackDamageType': { 'faces': newDamageInfo.faces, 'count': newDamageInfo.count},
          'attackDamageBonus': newDamageInfo.bonus
        });
      }

      var params = {
        TableName: 'characterDb',
        Item: {
            'characterName' : uuid
        }
      }

          params.Item.characterInfo = {}
          params.Item.characterInfo.characterName = characterName;

          if(classLevelString) params.Item.characterInfo.class = parseClassLevelString(classLevelString);
          if(background) params.Item.characterInfo.background = background;
          if(experience) params.Item.characterInfo.experience = experience;
          if(race) params.Item.characterInfo.race = race;
          if(alignment) params.Item.characterInfo.alignment = alignment;
          if(playerName) params.Item.characterInfo.playerName = playerName;
          if(personalityTraits && personalityTraits.trim()) params.Item.characterInfo.personalityTraits = personalityTraits;
          if(ideals && ideals.trim()) params.Item.characterInfo.ideals = ideals;
          if(flaws && flaws.trim()) params.Item.characterInfo.flaws = flaws;
          if(bonds && bonds.trim()) params.Item.characterInfo.bonds = bonds;

          if(strength
                || strengthMod
                || dex
                || dexMod
                || con
                || conMod
                || int
                || intMod
                || wis
                || wisMod
                || cha
                || chaMod
                || proficiencyBonus
                || perception
               )
          {
              var stats = {}
              if(strength) stats.strength = strength;
              if(strengthMod) stats.strengthMod = strengthMod;
              if(dex) stats.dexterity = dex;
              if(dexMod) stats.dexterityMod = dexMod;
              if(con) stats.constitution = con;
              if(conMod) stats.constitutionMod = conMod;
              if(int) stats.intelligence = int;
              if(intMod) stats.intelligenceMod = intMod;
              if(wis) stats.wisdom = wis;
              if(wisMod) stats.wisdomMod = wisMod;
              if(cha) stats.charisma = cha;
              if(chaMod) stats.charismaMod = chaMod;
              if(proficiencyBonus) stats.proficiencyBonus = proficiencyBonus;
              if(perception) stats.perception = perception;

              params.Item.stats = stats
          }


          if(armorClass
                || initiative
                || speed
                || maxHp
                || currentHp
                || tempHp
                || totalHitDie
                || currentHitDie
                || strSave
                || dexSave
                || conSave
                || intSave
                || wisSave
                || chaSave
               )
          {
              var survivalInfo = {}
              if(armorClass) survivalInfo.armorClass = armorClass;
              if(initiative) survivalInfo.initiative = initiative;
              if(speed) survivalInfo.speed = speed;
              if(maxHp) survivalInfo.maxHp = maxHp;
              if(currentHp) survivalInfo.currentHp = currentHp;
              if(tempHp) survivalInfo.tempHp = tempHp;
              if(totalHitDie) survivalInfo.totalHitDie = totalHitDie;
              if(currentHitDie) survivalInfo.currentHitDie = currentHitDie;
              if(strSave) survivalInfo.strengthSave = {save : strSave}
              if(dexSave) survivalInfo.dexteritySave = {save : dexSave}
              if(conSave) survivalInfo.constitutionSave = {save : conSave}
              if(intSave) survivalInfo.intelligenceSave = {save : intSave}
              if(wisSave) survivalInfo.wisdomSave = {save : wisSave}
              if(chaSave) survivalInfo.charismaSave = {save : chaSave}
              //deathSaveFailure
              //deathSaveSuccess

              params.Item.survivalInfo = survivalInfo
          }

          if(attackList.length > 0) {
            params.Item.attackInfo = {}
            params.Item.attackInfo.attacks = attackList;

          }
          //Inventory)

/*
            console.log("params.")
          for(var key in params) {console.log("\t" + key)}
            console.log("params.Item.")
          for(var key in params.Item) {console.log("\t" + key)}
          console.log("params.Item.characterName: " + params.Item.characterName)
          console.log("params.Item.characterInfo.")
          for(var key in params.Item.characterInfo) {console.log("\t" + key + ": " + params.Item.characterInfo[key])}
          console.log("params.Item.characterInfo.class")
          for(var key in params.Item.characterInfo.class) {console.log("\t" + key + ": " + params.Item.characterInfo[key])}
          console.log("params.Item.stats.")
          for(var key in params.Item.stats) {console.log("\t" + key + ": " + params.Item.stats[key])}
*/

          ddb.put(params, function(err, res){
            if(!err){
              callback();
            } else {
              throw err;
            }
          });
  }
};
