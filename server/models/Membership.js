
const mongoose = require("mongoose");
module.exports = mongoose.model("Membership", new mongoose.Schema({
  title:String,
  price:Number,
  duration:Number
}));
