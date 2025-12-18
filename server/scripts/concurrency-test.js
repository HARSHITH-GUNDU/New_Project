const axios = require('axios');

// Concurrency test script for RSVP join endpoint
// Usage: from server folder run `npm run concurrency-test`
// Make sure the server is running and `server/.env` has correct MONGO_URI

const API = process.env.API_BASE || 'http://localhost:5000/api';

async function signup(name, email, password = 'password') {
  const res = await axios.post(`${API}/auth/signup`, { name, email, password });
  return res.data.token;
}

async function createEvent(token, capacity = 5) {
  const payload = {
    title: `Concurrency Test ${Date.now()}`,
    description: 'Testing concurrent joins',
    date: new Date(Date.now() + 3600 * 1000).toISOString(),
    location: 'Test Lab',
    capacity
  };
  const res = await axios.post(`${API}/events`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return res.data._id;
}

async function joinEvent(token, eventId) {
  try {
    const res = await axios.post(`${API}/events/${eventId}/join`, null, { headers: { Authorization: `Bearer ${token}` } });
    return { ok: true, data: res.data };
  } catch (err) {
    return { ok: false, message: err.response?.data?.message || err.message };
  }
}

async function inspectEvent(eventId) {
  const res = await axios.get(`${API}/events/${eventId}`);
  return res.data;
}

(async () => {
  try {
    console.log('Starting concurrency RSVP test against', API);

    // Create a creator user and an event
    const creatorToken = await signup('creator-' + Date.now(), `creator+${Date.now()}@example.com`);
    console.log('Creator token ready');

    const CAPACITY = 5; // change if you want
    const eventId = await createEvent(creatorToken, CAPACITY);
    console.log('Created event', eventId, 'capacity', CAPACITY);

    // Create many users and attempt to join concurrently
    const NUM_USERS = 20; // > capacity
    const tokens = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const t = await signup(`user${i}-${Date.now()}`, `user${i}+${Date.now()}@example.com`);
      tokens.push(t);
    }
    console.log('Created', tokens.length, 'test users');

    // Run all join requests in parallel
    const promises = tokens.map(tok => joinEvent(tok, eventId));
    const results = await Promise.all(promises);

    const success = results.filter(r => r.ok).length;
    const failed = results.length - success;

    console.log('Join results: success=', success, 'failed=', failed);
    const failures = results.filter(r => !r.ok).map(r => r.message);
    console.log('Some failure messages (unique):', [...new Set(failures)].slice(0,10));

    const ev = await inspectEvent(eventId);
    console.log('Event attendeesCount:', ev.attendeesCount, 'attendees array length:', ev.attendees.length);
    console.log('Attendees (IDs):', ev.attendees.slice(0, 20));

    if (ev.attendeesCount > CAPACITY || ev.attendees.length > CAPACITY) {
      console.error('OVERBOOKED! attendeesCount or attendees array exceeds capacity.');
      process.exit(2);
    }

    console.log('Concurrency test finished. If success <= capacity and no overbooking, RSVP logic is robust.');
    process.exit(0);
  } catch (err) {
    console.error('Error running test:', err.message || err);
    process.exit(1);
  }
})();
