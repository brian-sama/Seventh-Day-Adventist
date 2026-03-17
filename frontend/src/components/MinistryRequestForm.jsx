import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './MinistryRequestForm.css';
import { fetchApi } from '../utils/api';

const MinistryRequestForm = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    receiving_church: '',
    receiving_location: '',
    request_type: 'preacher',
    invited_name: '',
    invited_church: '',
    event_type: '',
    event_date: '',
    elder_name: '',
    elder_contact: '',
    clerk_name: '',
    clerk_contact: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchApi('/api/ministry-requests/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (onComplete) onComplete();
    } catch (error) {
      // Errors are handled and toasted in fetchApi
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="form-container"
    >
      <form onSubmit={handleSubmit} className="premium-form">
        <h2 className="form-title">New Ministry Request</h2>
        
        <div className="form-grid">
          {/* Recipient Section */}
          <div className="form-section full">
            <h3>Recipient Details</h3>
            <div className="input-group">
              <label>Receiving Church</label>
              <input name="receiving_church" value={formData.receiving_church} onChange={handleChange} required placeholder="e.g. Makokoba SDA Church" />
            </div>
            <div className="input-group">
              <label>Location / Address</label>
              <input name="receiving_location" value={formData.receiving_location} onChange={handleChange} required placeholder="e.g. Makokoba, Bulawayo" />
            </div>
          </div>

          {/* Invited Person Section */}
          <div className="form-section">
            <h3>Invited Guest</h3>
            <div className="input-group">
              <label>Request Type</label>
              <select name="request_type" value={formData.request_type} onChange={handleChange}>
                <option value="preacher">Preacher Invitation</option>
                <option value="choir">Choir/Group Invitation</option>
              </select>
            </div>
            <div className="input-group">
              <label>Invited Name</label>
              <input name="invited_name" value={formData.invited_name} onChange={handleChange} required placeholder="e.g. Pr. John Doe" />
            </div>
            <div className="input-group">
              <label>Invited From (Church)</label>
              <input name="invited_church" value={formData.invited_church} onChange={handleChange} required placeholder="e.g. Bulawayo Central SDA" />
            </div>
          </div>

          {/* Event Section */}
          <div className="form-section">
            <h3>Event Details</h3>
            <div className="input-group">
              <label>Event Type</label>
              <input name="event_type" value={formData.event_type} onChange={handleChange} required placeholder="e.g. Sabbath Service / Crusade" />
            </div>
            <div className="input-group">
              <label>Event Date</label>
              <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required />
            </div>
          </div>

          {/* Signatories Section */}
          <div className="form-section full">
            <h3>Church Signatories Information</h3>
            <div className="signatory-inputs">
              <div className="input-group">
                <label>Head Elder Name</label>
                <input name="elder_name" value={formData.elder_name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Elder Contact</label>
                <input name="elder_contact" value={formData.elder_contact} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Clerk Name</label>
                <input name="clerk_name" value={formData.clerk_name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Clerk Contact</label>
                <input name="clerk_contact" value={formData.clerk_contact} onChange={handleChange} required />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Generate and Send for Approval'}
        </button>
      </form>
    </motion.div>
  );
};

export default MinistryRequestForm;
