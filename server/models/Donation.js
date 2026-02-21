
const mongoose = require("mongoose");
module.exports = mongoose.model("Donation", new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  category:String,
  amount:Number,
  status:{type:String,default:"pending"},
  paymentId:String,
  date:{type:Date,default:Date.now}
}));
