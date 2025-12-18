import React, { useState } from 'react';
import api from '../api';

export default function CreateEvent() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [image, setImage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    // basic client-side validation
    const errs = [];
    if (!title) errs.push('Title is required');
    if (!date) errs.push('Date and time are required');
    if (!capacity || Number(capacity) <= 0) errs.push('Capacity must be a positive number');
    if (errs.length) {
      setErrors(errs);
      return;
    }

    try {
      const data = new FormData();
      data.append('title', title);
      data.append('description', description);
      data.append('date', date);
      data.append('location', location);
      data.append('capacity', capacity);
      if (image) data.append('image', image);

      // Let the browser set the Content-Type (including the multipart boundary)
      await api.post('/events', data);
      // Show success message and clear the form (do not redirect to login)
      setSuccess('Event created successfully');
      setErrors([]);
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      setCapacity(10);
      setImage(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating event';
      setErrors([msg]);
    }
  };

  const [loadingGen, setLoadingGen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');

  const generateDescription = async () => {
    if (!title && !date && !location) {
      setErrors(['Provide at least a title, date, or location to generate a description.']);
      return;
    }
    setErrors([]);
    setLoadingGen(true);
    try {
      const res = await api.post('/events/generate-description', { title, date, location, capacity });
      if (res.data && res.data.description) setDescription(res.data.description);
    } catch (err) {
      console.error(err);
      alert('Failed to generate description');
    } finally {
      setLoadingGen(false);
    }
  };

  return (
    <div className="app-container">
      <div className="card" style={{ maxWidth: 720, margin: '12px auto' }}>
        <h3 style={{ marginTop: 0 }}>Create Event</h3>
          {success && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: 'var(--success)' }}>{success}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Go to <a href="/dashboard">Dashboard</a> or <a href="/my-events">My Events</a> to see the event details.
              </div>
            </div>
          )}
        <form className="form" onSubmit={submit}>
          <label>Title
            <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          </label>
          {errors.length > 0 && (
            <div style={{ color: 'var(--danger)', marginBottom: 8 }}>
              {errors.map((er, idx) => <div key={idx}>{er}</div>)}
            </div>
          )}
          <label style={{ marginTop: 8 }}>Description
            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={generateDescription} disabled={loadingGen}>{loadingGen ? 'Generating...' : 'Generate description'}</button>
            <div style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: 13 }}>Use AI to draft a description from the title/date/location.</div>
          </div>
          <label style={{ marginTop: 8 }}>Date & Time
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Location
            <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          </label>
          <label style={{ marginTop: 8 }}>Capacity
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
          </label>
          <label style={{ marginTop: 8 }}>Image
            <input type="file" onChange={e => setImage(e.target.files[0])} accept="image/*" />
          </label>
          <div style={{ marginTop: 12 }}>
            <button className="btn" type="submit">Create Event</button>
          </div>
        </form>
      </div>
    </div>
  );
}
