const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  capacity: { type: Number, required: true },
  imagePath: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attendeesCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
