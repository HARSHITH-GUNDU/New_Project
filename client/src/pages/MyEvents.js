import React, { useEffect, useState } from 'react';
import api, { API_ORIGIN, getUserIdFromToken } from '../api';

export default function MyEvents() {
  const [created, setCreated] = useState([]);
  const [attending, setAttending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/events/mine');
      setCreated(res.data.created || []);
      setAttending(res.data.attending || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const leave = async (id) => {
    if (!window.confirm('Leave this event?')) return;
    try {
      await api.post(`/events/${id}/leave`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Leave failed');
    }
  };

  if (loading) return <div className="app-container">Loading...</div>;

  const userId = getUserIdFromToken();

  return (
    <div className="app-container">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2>My Events</h2>

        <section style={{ marginBottom: 24 }}>
          <h3>Events I Created</h3>
          {created.length === 0 && <p className="muted">You haven't created any events yet.</p>}
          <div style={{ overflowX: 'auto' }}>
            <table className="events-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Attendees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {created.map(ev => (
                  <tr key={ev._id}>
                    <td className="thumb-cell">{ev.imagePath && <img className="thumb" src={ev.imagePath.startsWith('http') ? ev.imagePath : `${API_ORIGIN}${ev.imagePath}`} alt="" />}</td>
                    <td>{ev.title}</td>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{ev.location || '-'}</td>
                    <td>{ev.capacity}</td>
                    <td>{ev.attendeesCount || 0}</td>
                    <td>
                      <a className="btn" href={`/events/${ev._id}/edit`}>Edit</a>
                      <button className="btn secondary" onClick={() => remove(ev._id)} style={{ marginLeft: 8 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3>Events I'm Attending</h3>
          {attending.length === 0 && <p className="muted">You're not attending any events.</p>}
          <div style={{ overflowX: 'auto' }}>
            <table className="events-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Creator</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attending.map(ev => (
                  <tr key={ev._id}>
                    <td className="thumb-cell">{ev.imagePath && <img className="thumb" src={ev.imagePath.startsWith('http') ? ev.imagePath : `${API_ORIGIN}${ev.imagePath}`} alt="" />}</td>
                    <td>{ev.title}</td>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{ev.location || '-'}</td>
                    <td>{ev.creator?.name || '-'}</td>
                    <td>
                      <button className="btn secondary" onClick={() => leave(ev._id)}>Leave</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
