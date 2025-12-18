import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function EditEvent() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const ev = res.data;
        setTitle(ev.title || '');
        setDescription(ev.description || '');
        setDate(ev.date ? new Date(ev.date).toISOString().slice(0,16) : '');
        setLocation(ev.location || '');
        setCapacity(ev.capacity || 10);
      } catch (err) {
        alert('Failed to load event');
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', title);
      data.append('description', description);
      data.append('date', date);
      data.append('location', location);
      data.append('capacity', capacity);
      if (image) data.append('image', image);

      await api.put(`/events/${id}`, data);
      window.location.href = '/my-events';
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="app-container">Loading...</div>;

  return (
    <div className="app-container">
      <div className="card" style={{ maxWidth: 720, margin: '12px auto' }}>
        <h3 style={{ marginTop: 0 }}>Edit Event</h3>
        <form className="form" onSubmit={submit}>
          <label>Title
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Description
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label style={{ marginTop: 8 }}>Date & Time
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Location
            <input value={location} onChange={e => setLocation(e.target.value)} />
          </label>
          <label style={{ marginTop: 8 }}>Capacity
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Replace Image
            <input type="file" onChange={e => setImage(e.target.files[0])} accept="image/*" />
          </label>
          <div style={{ marginTop: 12 }}>
            <button className="btn" type="submit">Save Changes</button>
            <a className="btn secondary" href="/my-events" style={{ marginLeft: 8 }}>Cancel</a>
          </div>
        </form>
      </div>
    </div>
  );
}
