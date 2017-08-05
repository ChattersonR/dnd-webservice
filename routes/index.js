var express = require('express');
var router = express.Router();

var testJson = require('../test/testCharacter.json')

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log(testJson)
    res.render('stats', testJson);
});

module.exports = router;
