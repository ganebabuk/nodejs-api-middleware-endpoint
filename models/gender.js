const mongoose = require('mongoose');

const genderSchema = mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

module.exports = mongoose.model('Gender', genderSchema);