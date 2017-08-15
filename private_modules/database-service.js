//Reference http://wern-ancheta.com/blog/2015/04/26/getting-started-with-couchdb-in-node-dot-js/
var nano = require('nano')('http://localhost:5984');
var characterDb = nano.db.use('character-db');

characterDb.update = function(obj, key, callback){
  var db = this;
  db.get(key, function(error, existing){
    if(!error) {
      obj._rev = existing._rev;
    }
    db.insert(obj, key, callback);
  });
};

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
    classLevel.className = splitArray[0];
    classLevel.level = splitArray[1];
    returnArray.push(classLevel);
  });
  return returnArray;
}

module.exports={
  getCharacterList: function (callback) {
    characterDb.view('character', 'by_name', function(err, body){
      if(!err){
        var returnObject = { 'names':[] };
        body.rows.forEach(function(doc){
          returnObject.names.push(doc.key);
        });
        callback(returnObject);
      } else {
        throw err;
      }
    });
  },

  getCharacterRecord: function (characterName, callback) {
    console.log("Retrieving character data for: " + characterName);
    characterDb.view('character', 'by_name', {'key': characterName, 'include_docs': true}, function(err, body){
      if(!err){
        var characterData = body.rows[0].doc;
        callback(characterData);
      } else {
        throw err;
      }
    });
  },

  createNewCharacter: function(characterName, callback) {
    characterDb.insert({'characterInfo':{'characterName':characterName}}, function(err, body){
      if(!err){
        callback();
        //callback(body.rows[0].doc);
        //Do nothing?
      } else {
        throw err;
      }
    });
  },

  updateCharacter: function(docId, characterName, classLevelString, race,
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
      for(i = 0; i < weaponList.length; i++) {
        var damageInfo = parseDamageString(damageStringList[i]);
        attackList.push({
          'weaponName': weaponList[i],
          'attackBonus': attackBonusList[i],
          'attackDamageType': { 'faces': damageInfo.faces, 'count': damageInfo.count},
          'attackDamageBonus': damageInfo.bonus
        });
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

      characterDb.get(docId, function(err, doc){
        if(!err){
          console.log(doc);

          doc.characterInfo.characterName = characterName;
          doc.characterInfo.class = parseClassLevelString(classLevelString);
          doc.characterInfo.background = background;
          doc.characterInfo.experience = experience;
          doc.characterInfo.race = race;
          doc.characterInfo.alignment = alignment;
          doc.characterInfo.playerName = playerName;
          doc.characterInfo.personalityTraits = personalityTraits;
          doc.characterInfo.ideals = ideals;
          doc.characterInfo.flaws = flaws;
          doc.characterInfo.bonds = bonds;

          doc.stats.strength = strength;
          doc.stats.strengthMod = strengthMod;
          doc.stats.dexterity = dex;
          doc.stats.dexterityMod = dexMod;
          doc.stats.constitution = con;
          doc.stats.constitutionMod = conMod;
          doc.stats.intelligence = int;
          doc.stats.intelligenceMod = intMod;
          doc.stats.wisdom = wis;
          doc.stats.wisdomMod = wisMod;
          doc.stats.charisma = cha;
          doc.stats.charismaMod = chaMod;
          doc.stats.proficiencyBonus = proficiencyBonus;
          doc.stats.perception = perception;

          doc.survivalInfo.armorClass = armorClass;
          doc.survivalInfo.initiative = initiative;
          doc.survivalInfo.speed = speed;
          doc.survivalInfo.maxHp = maxHp;
          doc.survivalInfo.currentHp = currentHp;
          doc.survivalInfo.tempHp = tempHp;
          doc.survivalInfo.totalHitDie = totalHitDie;
          doc.survivalInfo.currentHitDie = currentHitDie;
          doc.survivalInfo.strengthSave.save = strSave;
          doc.survivalInfo.dexteritySave.save = dexSave;
          doc.survivalInfo.constitutionSave.save = conSave;
          doc.survivalInfo.intelligenceSave.save = intSave;
          doc.survivalInfo.wisdomSave.save = wisSave;
          doc.survivalInfo.charismaSave.save = chaSave;
          //deathSaveFailure
          //deathSaveSuccess

          doc.attackInfo.attacks = attackList;

          //Inventory

          characterDb.update(doc, docId, function(err, res){
            if(!err){
              callback();
            } else {
              throw err;
            }
          });
        } else {
          throw err;
        }
    });
  }
};
