const mongoose = require('mongoose');
const { Schema } = mongoose;
// const financialInfo = require('./FinancialInfo');

const userSchema = new Schema({
  id: Number,
  user: { 
    type: String, 
    required: true 
  },       // Username field
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },      // Email field
  password: { 
    type: String, 
    required: true 
  },   // Plain text password for testing
  financialInfo: {    // Reference to FinancialInfo collection
    type: Schema.Types.ObjectId,
    ref: 'FinancialInfo'
  }
});

module.exports = mongoose.model('User', userSchema);
