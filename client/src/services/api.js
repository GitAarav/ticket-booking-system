// ==========================================================================
// PULSE API CLIENT — talks only to the real backend. No mock fallbacks: if a
// request fails, it throws, and the UI shows a real error instead of quietly
// inventing data.
// ==========================================================================

function getAuthHeader() {
  const token = localStorage.getItem('pulse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? getAuthHeader() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    // An authenticated request that comes back 401 means the token itself is
    // gone (expired/invalid) — not a wrong-password case, those never reach
    // here with auth:true. Force back to a clean logged-out state instead of
    // leaving the UI looking "logged in" while every action silently fails.
    if (res.status === 401 && auth) {
      localStorage.removeItem('pulse_user');
      localStorage.removeItem('pulse_token');
      window.location.href = '/';
      return new Promise(() => {}); // navigation is in flight; don't resolve into stale code
    }
    const err = new Error(data?.error || `request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// 1. Auth API
export const authApi = {
  register({ name, email, password, role }) {
    return request('/auth/register', { method: 'POST', body: { name, email, password, role }, auth: false });
  },
  login({ email, password }) {
    return request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  },
  getMe() {
    return request('/auth/me');
  },
};

// 2. Customer API
export const customerApi = {
  async getEvents({ type, search } = {}) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    const query = params.toString();
    const data = await request(`/customer/events${query ? `?${query}` : ''}`);
    return data.events;
  },
  async getShowsForEvent(eventId) {
    const data = await request(`/customer/events/${eventId}/shows`);
    return data.shows;
  },
  async getShowDetail(showId) {
    const data = await request(`/customer/shows/${showId}`);
    return data.show;
  },
  async getSeatmap(showId) {
    const data = await request(`/customer/shows/${showId}/seatmap`);
    return data.seatmap;
  },
  async holdSeats(showId, seatIds) {
    return request(`/customer/shows/${showId}/hold`, { method: 'POST', body: { seatIds } });
  },
  async confirmBooking(showId, seatIds) {
    return request(`/customer/shows/${showId}/confirm`, { method: 'POST', body: { seatIds } });
  },
  async joinWaitlist(showId, categoryId) {
    return request(`/customer/shows/${showId}/waitlist`, { method: 'POST', body: { categoryId } });
  },
  async getBookings() {
    const data = await request('/customer/bookings');
    return data.bookings;
  },
  async cancelBooking(bookingId) {
    return request(`/customer/bookings/${bookingId}/cancel`, { method: 'POST' });
  },
};

// 3. Organiser API
export const organiserApi = {
  async getVenues() {
    const data = await request('/organiser/venues');
    return data.venues;
  },
  async getEvents() {
    const data = await request('/organiser/events');
    return data.events;
  },
  async createEvent({ title, type, description }) {
    const data = await request('/organiser/events', { method: 'POST', body: { title, type, description } });
    return data.event;
  },
  async getShowsForEvent(eventId) {
    const data = await request(`/organiser/events/${eventId}/shows`);
    return data.shows;
  },
  async scheduleShow(eventId, { venueId, showDate, showTime, pricing }) {
    const data = await request(`/organiser/events/${eventId}/shows`, {
      method: 'POST',
      body: { venueId, showDate, showTime, pricing },
    });
    return data.show;
  },
  async getEventSummary(eventId) {
    const data = await request(`/organiser/events/${eventId}/summary`);
    return data.summary;
  },
};

// 4. Admin API
export const adminApi = {
  async getVenues() {
    const data = await request('/admin/venues');
    return data.venues;
  },
  async createVenue({ name, address }) {
    const data = await request('/admin/venues', { method: 'POST', body: { name, address } });
    return data.venue;
  },
  async createCategory(venueId, name) {
    const data = await request(`/admin/venues/${venueId}/categories`, { method: 'POST', body: { name } });
    return data.category;
  },
  async bulkCreateSeats(venueId, seats) {
    const data = await request(`/admin/venues/${venueId}/seats/bulk`, { method: 'POST', body: { seats } });
    return data.seats;
  },
  async getVenueSeatmap(venueId) {
    const data = await request(`/admin/venues/${venueId}/seatmap`);
    return data.seatmap;
  },
};

// 5. Offers API — no auth header, the token in the URL is the credential
export const offersApi = {
  confirmOfferToken(token) {
    return fetch(`/offers/${token}/confirm`, { method: 'POST' }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data?.error || 'this offer link is invalid or has expired');
        err.status = res.status;
        throw err;
      }
      return data;
    });
  },
};

// 6. SSE real-time seatmap subscription. NOTE: browser EventSource can't set
// an Authorization header, so this only works if the seatmap route allows
// an unauthenticated read — falls back to manual polling if the connection
// errors immediately.
export function subscribeToSeatmap(showId, onUpdate) {
  let closed = false;
  let pollInterval = null;
  let es = null;

  const startPolling = () => {
    if (pollInterval) return;
    pollInterval = setInterval(async () => {
      try {
        const seatmap = await customerApi.getSeatmap(showId);
        if (!closed) onUpdate(seatmap);
      } catch (_) {}
    }, 4000);
  };

  try {
    es = new EventSource(`/customer/shows/${showId}/seatmap/stream`);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.seatmap) onUpdate(parsed.seatmap);
      } catch (_) {}
    };
    es.onerror = () => {
      es.close();
      startPolling();
    };
  } catch (_) {
    startPolling();
  }

  return () => {
    closed = true;
    if (es) es.close();
    if (pollInterval) clearInterval(pollInterval);
  };
}
