const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = new Schema({
    username:String,
    mail:String
});

module.exports = mongoose.model('User', userSchema); 