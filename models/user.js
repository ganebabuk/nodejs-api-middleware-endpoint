const mongoose = require('mongoose');

const userProfileSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: {type: String, required: true},
  marks: [
    {
      english: { type: Number, required: true },
      maths: { type: Number, required: true }
    }
  ],
  date_created: { type: Date, required: true},
});

module.exports = mongoose.model('Users', userProfileSchema);