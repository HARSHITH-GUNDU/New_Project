const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const auth = require('../middleware/auth');
const Event = require('../models/Event');

// multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create event
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location, capacity } = req.body;
    if (!title || !date || !capacity) return res.status(400).json({ message: 'Missing required fields' });

    const event = new Event({
      title,
      description,
      date: new Date(date),
      location,
      capacity: Number(capacity),
      creator: req.user._id,
      imagePath: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple description generation (AI-stub) - fills a friendly description from inputs
router.post('/generate-description', auth, async (req, res) => {
  try {
    const { title, date, location, capacity } = req.body;
    const parts = [];
    if (title) parts.push(`"${title}"`);
    if (location) parts.push(`at ${location}`);
    let when = '';
    if (date) {
      try { when = `on ${new Date(date).toLocaleString()}`; } catch (e) { when = '' }
    }
    const capText = capacity ? `Limited to ${capacity} attendees.` : '';

    const description = `Join us ${parts.length ? parts.join(' ') : ''} ${when}. ${capText} This event is a great opportunity to meet like-minded people, learn something new, and have fun. Bring your friends and RSVP soon!`;
    res.json({ description });
  } catch (err) {
    console.error('generate-description error', err);
    res.status(500).json({ message: 'Could not generate description' });
  }
});

// Get all upcoming events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).populate('creator', 'name');
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events for current user: created and attending
router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = String(userId);

    console.log('[GET /events/mine] user:', userIdStr);

    // Match either ObjectId or string in case earlier writes used a string id
    const created = await Event.find({ $or: [{ creator: userId }, { creator: userIdStr }] })
      .sort({ date: 1 })
      .populate('creator', 'name');

    const attending = await Event.find({ $or: [{ attendees: userId }, { attendees: userIdStr }] })
      .sort({ date: 1 })
      .populate('creator', 'name');

    console.log('[GET /events/mine] found created:', created.length, 'attending:', attending.length);

    res.json({ created, attending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event by id
router.get('/:id', async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id).populate('creator', 'name');
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    res.json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit event (only creator)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    if (String(ev.creator) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    const { title, description, date, location, capacity } = req.body;
    if (title) ev.title = title;
    if (description) ev.description = description;
    if (date) ev.date = new Date(date);
    if (location) ev.location = location;
    if (capacity) ev.capacity = Number(capacity);
    if (req.file) ev.imagePath = `/uploads/${req.file.filename}`;

    await ev.save();
    res.json(ev);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Not found' });
    if (String(ev.creator) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    await Event.deleteOne({ _id: ev._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// RSVP join - atomic update to avoid overbooking
router.post('/:id/join', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = String(userId);
    const eventId = req.params.id;

    // Atomic update: ensure user is not present (check both ObjectId and string) and capacity not exceeded
    const updated = await Event.findOneAndUpdate(
      { _id: eventId, attendees: { $nin: [userId, userIdStr] }, $expr: { $lt: ["$attendeesCount", "$capacity"] } },
      { $inc: { attendeesCount: 1 }, $addToSet: { attendees: userId } },
      { new: true }
    );

    if (!updated) {
      // check current state to give a friendly error
      const ev = await Event.findById(eventId);
      if (!ev) return res.status(404).json({ message: 'Event not found' });
      if (ev.attendees.some(a => String(a) === userIdStr)) return res.status(400).json({ message: 'Already joined' });
      if (ev.attendeesCount >= ev.capacity) return res.status(400).json({ message: 'Event full' });
      return res.status(400).json({ message: 'Unable to join' });
    }

    res.json({ message: 'Joined', event: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave event
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = String(userId);
    const eventId = req.params.id;

    const updated = await Event.findOneAndUpdate(
      { _id: eventId, attendees: { $in: [userId, userIdStr] } },
      { $inc: { attendeesCount: -1 }, $pull: { attendees: { $in: [userId, userIdStr] } } },
      { new: true }
    );

    if (!updated) return res.status(400).json({ message: 'Not attending' });
    res.json({ message: 'Left', event: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
