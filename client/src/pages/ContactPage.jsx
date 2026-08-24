import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Mail, MessageSquare, ChevronDown, ChevronUp, Send, Sparkles, HelpCircle } from 'lucide-react';

export function ContactPage() {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState(0);

  const faqs = [
    {
      q: 'How does the 10-minute seat hold work?',
      a: 'When you select seats and click "Hold", our system locks the seats with a 10-minute timer. Other users see the seat as held and cannot book it. If you do not checkout within 10 minutes, the hold auto-releases back to the seat map.',
    },
    {
      q: 'What happens if I cancel a confirmed booking?',
      a: 'When you cancel a booking from your Passbook Wallet, the seat is immediately freed. If other users are waiting on the category waitlist, the oldest waiting user automatically receives an exclusive 15-minute booking offer token via email.',
    },
    {
      q: 'Can two people ever double-book the same seat?',
      a: 'No. Pulse uses single atomic UPDATE statements with conditional WHERE clauses on PostgreSQL. Postgres serializes writers with row-level locks so simultaneous requests for the same seat can never both succeed.',
    },
    {
      q: 'How do I redeem a waitlist offer link?',
      a: 'If you receive an offer token, open the "Waitlist Offers" page in the navigation and submit your token before the 15-minute countdown clock expires.',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast('Message sent! Our support team will get back to you shortly.', 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 600);
  };

  return (
    <div className="container" style={{ maxWidth: '960px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="pill-tag pill-tag-lime">SUPPORT & ASSISTANCE</span>
          <span className="pill-tag pill-tag-movie">24/7 HELPDESK</span>
        </div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 900, marginBottom: '8px' }}>
          Get in Touch with Pulse
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Have a question about your booking, waitlist offers, or seat holds? We're here to help.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
        {/* Contact Form */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(204, 255, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-lime)',
              }}
            >
              <Mail size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Send Us a Message</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Typical response time: under 15 minutes</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                required
                placeholder="Alex Hunter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@pulse.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                required
                placeholder="Booking inquiry, refund, or feedback..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                rows={4}
                required
                placeholder="How can our support team help you today?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              {loading ? 'Sending Message...' : 'Send Message'} <Send size={16} />
            </button>
          </form>
        </div>

        {/* Frequently Asked Questions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <HelpCircle size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isExpanded ? 'var(--accent-lime)' : 'var(--text-primary)' }}>
                      {faq.q}
                    </h3>
                    {isExpanded ? <ChevronUp size={18} color="var(--accent-lime)" /> : <ChevronDown size={18} />}
                  </div>
                  {isExpanded && (
                    <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
