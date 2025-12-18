import React, { useEffect, useState } from 'react';
import api, { API_ORIGIN, getUserIdFromToken } from '../api';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load events');
    }
  };

  useEffect(() => { load(); }, []);

  const join = async (id) => {
    try {
      await api.post(`/events/${id}/join`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const leave = async (id) => {
    try {
      await api.post(`/events/${id}/leave`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const isAuthenticated = !!localStorage.getItem('token');

  const filtered = events.filter(ev => {
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (fromDate) {
      const d = new Date(ev.date);
      if (d < new Date(fromDate)) return false;
    }
    if (toDate) {
      const d = new Date(ev.date);
      if (d > new Date(toDate)) return false;
    }
    return true;
  });

  return (
    <div>
      <section className="card" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h1 style={{ margin: 0 }}>Find and Join Local Events</h1>
            <p className="muted">Create events, invite people, and manage RSVPs — built with MongoDB, Express, React and Node.</p>
            <div style={{ marginTop: 12 }}>
              {!isAuthenticated ? (
                <a href="/signup" className="btn">Get Started</a>
              ) : (
                <a href="/create" className="btn">Create Event</a>
              )}
            </div>
          </div>
          <div style={{ flex: '0 0 320px' }}>
            <img src="https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=60" alt="events" style={{ width: '100%', borderRadius: 8 }} />
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ marginTop: 0 }}>Upcoming Events</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input placeholder="Search by title" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #e6e9ef' }} />
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>From
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>To
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </label>
          <button className="btn secondary" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); }} style={{ marginLeft: 8 }}>Clear</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="events-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => {
                const userId = getUserIdFromToken();
                const userIdStr = userId ? String(userId) : null;
                const isAttending = userId && ev.attendees && ev.attendees.some(a => String(a) === userIdStr);
                const isFull = ev.attendeesCount >= ev.capacity;
                const joinDisabled = !userId || isAttending || isFull;
                const leaveDisabled = !userId || !isAttending;
                const joinReason = !userId ? 'Log in to join' : isAttending ? 'You have already joined' : isFull ? 'Event is full' : '';
                const leaveReason = !userId ? 'Log in to leave' : !isAttending ? 'You are not attending' : '';

                return (
                  <tr key={ev._id}>
                    <td className="thumb-cell">{ev.imagePath && <img className="thumb" src={ev.imagePath.startsWith('http') ? ev.imagePath : `${API_ORIGIN}${ev.imagePath}`} alt="" />}</td>
                    <td>{ev.title}</td>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{ev.location || '-'}</td>
                    <td>{ev.attendeesCount}/{ev.capacity}</td>
                    <td>
                      <button className="btn" onClick={() => join(ev._id)} disabled={joinDisabled} title={joinDisabled ? joinReason : 'Join this event'}>Join</button>
                      <button className="btn secondary" onClick={() => leave(ev._id)} style={{ marginLeft: 8 }} disabled={leaveDisabled} title={leaveDisabled ? leaveReason : 'Leave this event'}>Leave</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
