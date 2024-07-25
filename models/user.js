const mongoose = require('mongoose');

const userProfileSchema = mongoose.Schema({
  _id: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: Number, required: true },
  date_created: { type: Date, required: true},
  marks: [
    {
      english: { type: Number, required: false },
      maths: { type: Number, required: false }
    }
  ]
});

module.exports = mongoose.model('User', userProfileSchema);