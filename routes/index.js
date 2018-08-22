var express = require('express');
var router = express.Router();
var dbService = require('../private_modules/database-service.js');
var testJson = require('../test/testCharacter.json');

/* GET home page. */
router.get('/', function(req, res, next) {
    dbService.getCharacterList(function(characterNames){
        res.render('index', characterNames);
    });
});

router.post('/', function(req, res, next) {
    var characterName = req.body.newCharName;
    dbService.createNewCharacter(characterName, function(uuid){
        res.redirect('/' + uuid);
        //res.render('stats', characterData);
    });
});

router.get('/:uuid', function(req, res, next) {
    dbService.getCharacterRecord(req.params.uuid, function(characterData){
        console.log("Character data returned by DB: " + characterData)
        res.render('stats', characterData);
    });
});

router.post('/:uuid', function(req, res, next) {
    dbService.updateCharacter(
        req.params.uuid,
        req.body.charName,
        req.body.classLevel,
        req.body.race,
        req.body.background,
        req.body.alignment,
        req.body.experience,
        req.body.playerName,
        req.body.strength,
        req.body.strengthMod,
        req.body.dexterity,
        req.body.dexterityMod,
        req.body.constitution,
        req.body.constitutionMod,
        req.body.intelligence,
        req.body.intelligenceMod,
        req.body.wisdom,
        req.body.wisdomMod,
        req.body.charisma,
        req.body.charismaMod,
        req.body.armorClass,
        req.body.initiative,
        req.body.speed,
        req.body.maxHp,
        req.body.currentHp,
        req.body.tempHp,
        req.body.totalHitDie,
        req.body.currentHitDie,
        //death save success,
        //death save fail,
        req.body.strengthSave,
        req.body.dexteritySave,
        req.body.constitutionSave,
        req.body.intelligenceSave,
        req.body.wisdomSave,
        req.body.charismaSave,
        req.body.inspiration,
        req.body.proficiencyBonus,
        req.body.perception,
        req.body.weaponName,
        req.body.attackBonus,
        req.body.damage,
        req.body.newWeaponName,
        req.body.newAttackBonus,
        req.body.newDamage,
        req.body.personalityTraits,
        req.body.ideals,
        req.body.flaws,
        req.body.bonds,
        req.body.inventory,
        function(){
            res.redirect('/' + req.params.uuid);
        }
    );
});

module.exports = router;
