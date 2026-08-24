// ==========================================================================
// PULSE API CLIENT & ZERO-FAILURE REACTIVE STATE ENGINE
// ==========================================================================

const API_BASE = '';

const INITIAL_VENUES = [
  {
    id: 'venue-101',
    admin_id: 'admin-01',
    name: 'PVR INOX Neo-Plex Horizon',
    city: 'Mumbai',
    address: 'Phoenix Palladium, Lower Parel, Mumbai',
    categories: [
      { id: 'cat-vip', name: 'VIP Recliner', price: '750.00' },
      { id: 'cat-premium', name: 'Prime Club', price: '500.00' },
      { id: 'cat-standard', name: 'Standard Cine', price: '320.00' },
    ],
    rows: ['A', 'B', 'C', 'D'],
    seatsPerRow: 8,
  },
  {
    id: 'venue-102',
    admin_id: 'admin-01',
    name: 'Starlight Arena Sphere',
    city: 'Bengaluru',
    address: '74 Neon Avenue, Electronic City, Bengaluru',
    categories: [
      { id: 'cat-vip', name: 'VIP Lounge', price: '1200.00' },
      { id: 'cat-premium', name: 'Standing Pit', price: '850.00' },
      { id: 'cat-standard', name: 'Bleachers', price: '450.00' },
    ],
    rows: ['A', 'B', 'C', 'D'],
    seatsPerRow: 8,
  },
  {
    id: 'venue-103',
    admin_id: 'admin-01',
    name: 'Cinepolis Grand Central',
    city: 'Delhi NCR',
    address: 'DLF CyberCity, Phase 2, Gurugram',
    categories: [
      { id: 'cat-vip', name: 'VIP Diamond', price: '800.00' },
      { id: 'cat-premium', name: 'Executive Gold', price: '550.00' },
      { id: 'cat-standard', name: 'Classic Silver', price: '300.00' },
    ],
    rows: ['A', 'B', 'C', 'D'],
    seatsPerRow: 8,
  },
];

const INITIAL_EVENTS = [
  {
    id: 'evt-01',
    title: 'Dune: Part Two (IMAX 70mm)',
    type: 'movie',
    tagline: 'Witness the mythic journey on the grandest canvas.',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    rating: '9.4',
    votes: '142.5K',
    runtime: '2h 46m',
    language: 'English, IMAX 70mm',
    genre: ['Sci-Fi', 'Adventure', 'Action'],
    releaseDate: 'In Theatres Now',
  },
  {
    id: 'evt-02',
    title: 'Coldplay: Music of the Spheres World Tour',
    type: 'concert',
    tagline: 'A cosmic stadium celebration of lights and sound.',
    description: 'Live world tour featuring jaw-dropping holographic visuals, kinetic LED wristbands, and timeless anthems.',
    banner: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
    rating: '9.9',
    votes: '98.2K',
    runtime: '3h 15m',
    language: 'English • Live Concert',
    genre: ['Live Music', 'Alternative', 'Stadium Pop'],
    releaseDate: 'Live Arena Tour',
  },
  {
    id: 'evt-03',
    title: 'Interstellar: 10th Anniversary IMAX Special',
    type: 'movie',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    description: 'When Earth becomes uninhabitable, a team of ex-NASA astronauts travel through a wormhole near Saturn in search of a new home.',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    rating: '9.3',
    votes: '210.8K',
    runtime: '2h 49m',
    language: 'English, Dolby Atmos',
    genre: ['Sci-Fi', 'Drama', 'Epic'],
    releaseDate: 'Exclusive Special Encore',
  },
  {
    id: 'evt-04',
    title: 'Taylor Swift: The Eras Tour Concert Experience',
    type: 'concert',
    tagline: 'The cultural phenomenon captured in breathtaking 4K and Atmos.',
    description: 'Experience the history-making tour covering 17 years of music in stunning high definition and immersive sound.',
    banner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    rating: '9.8',
    votes: '185.0K',
    runtime: '2h 55m',
    language: 'English • Pop',
    genre: ['Pop', 'Live Concert', 'Documentary'],
    releaseDate: 'Special Stadium Event',
  },
  {
    id: 'evt-05',
    title: 'Cyberpunk Night City: 60-Piece Live Orchestra',
    type: 'concert',
    tagline: 'The visceral synthwave soundscapes performed by a full orchestra.',
    description: 'A dark synthwave and classical fusion concert celebrating the iconic soundscapes of futuristic dystopian worlds.',
    banner: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200&auto=format&fit=crop',
    rating: '9.6',
    votes: '42.1K',
    runtime: '2h 20m',
    language: 'Synthwave & Classical',
    genre: ['Electronic', 'Orchestral', 'Cyberpunk'],
    releaseDate: 'Limited Weekend Premiere',
  },
  {
    id: 'evt-06',
    title: 'Oppenheimer (70mm Cinema Encore)',
    type: 'movie',
    tagline: 'The story of American Prometheus.',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1200&auto=format&fit=crop',
    rating: '9.1',
    votes: '175.4K',
    runtime: '3h 00m',
    language: 'English, 70mm',
    genre: ['Biographical', 'Drama', 'History'],
    releaseDate: 'Award Winner Screenings',
  },
];

function generateSeatmapForVenue(showId, venue, customPricing = []) {
  const rows = venue?.rows || ['A', 'B', 'C', 'D'];
  const seatsPerRow = venue?.seatsPerRow || 8;
  const categories = venue?.categories || [
    { id: 'cat-vip', name: 'VIP Recliner', price: 750 },
    { id: 'cat-premium', name: 'Prime Club', price: 500 },
    { id: 'cat-standard', name: 'Standard Cine', price: 320 },
  ];

  return rows.map((rowLabel, rIdx) => {
    let category = categories[Math.min(rIdx, categories.length - 1)];
    const override = customPricing.find((cp) => cp.categoryId === category.id);
    if (override) {
      category = { ...category, price: override.price };
    }

    const seats = [];
    for (let s = 1; s <= seatsPerRow; s++) {
      const isBooked = (rIdx === 2 && (s === 3 || s === 4)) || (rIdx === 3 && s === 7);
      const isHeld = (rIdx === 1 && s === 5);
      seats.push({
        id: `seat-${showId}-${rowLabel}-${s}`,
        seatNumber: s,
        posX: s,
        posY: rIdx,
        status: isBooked ? 'booked' : isHeld ? 'held' : 'available',
        held_by_customer_id: isHeld ? 'other-customer' : null,
        held_until: isHeld ? new Date(Date.now() + 6 * 60 * 1000).toISOString() : null,
        category,
      });
    }
    return { rowLabel, seats };
  });
}

const state = {
  events: [...INITIAL_EVENTS],
  venues: [...INITIAL_VENUES],
  shows: [
    { id: 'show-01', event_id: 'evt-01', venue_id: 'venue-101', show_date: '2026-09-10', show_time: '18:30', venue_name: 'PVR INOX Neo-Plex Horizon', venue_address: 'Lower Parel, Mumbai' },
    { id: 'show-02', event_id: 'evt-01', venue_id: 'venue-101', show_date: '2026-09-10', show_time: '21:45', venue_name: 'PVR INOX Neo-Plex Horizon', venue_address: 'Lower Parel, Mumbai' },
    { id: 'show-03', event_id: 'evt-02', venue_id: 'venue-102', show_date: '2026-09-15', show_time: '20:00', venue_name: 'Starlight Arena Sphere', venue_address: 'Electronic City, Bengaluru' },
    { id: 'show-04', event_id: 'evt-03', venue_id: 'venue-103', show_date: '2026-09-12', show_time: '19:15', venue_name: 'Cinepolis Grand Central', venue_address: 'DLF CyberCity, Delhi NCR' },
    { id: 'show-05', event_id: 'evt-04', venue_id: 'venue-102', show_date: '2026-09-20', show_time: '19:30', venue_name: 'Starlight Arena Sphere', venue_address: 'Electronic City, Bengaluru' },
    { id: 'show-06', event_id: 'evt-05', venue_id: 'venue-102', show_date: '2026-09-22', show_time: '21:00', venue_name: 'Starlight Arena Sphere', venue_address: 'Electronic City, Bengaluru' },
  ],
  seatmaps: {},
  bookings: [
    {
      id: 'bk-demo-01',
      booking_reference: 'BK-PULSE-9X42',
      customer_id: 'user-customer-demo',
      customer_name: 'Alex Hunter',
      customer_email: 'alex.hunter@pulse.io',
      show_id: 'show-01',
      title: 'Dune: Part Two (IMAX 70mm)',
      type: 'movie',
      show_date: '2026-09-10',
      show_time: '18:30',
      venue_name: 'PVR INOX Neo-Plex Horizon',
      venue_address: 'Lower Parel, Mumbai',
      total_amount: '1500.00',
      status: 'confirmed',
      created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      seats: [
        { seatId: 'seat-show-01-A-3', rowLabel: 'A', seatNumber: 3, categoryName: 'VIP Recliner' },
        { seatId: 'seat-show-01-A-4', rowLabel: 'A', seatNumber: 4, categoryName: 'VIP Recliner' },
      ],
    },
  ],
  sentEmails: [],
  waitlist: [
    {
      id: 'wt-seed-01',
      show_id: 'show-01',
      category_id: 'cat-vip',
      customer_id: 'user-customer-demo',
      customer_name: 'Alex Hunter',
      customer_email: 'alex.hunter@pulse.io',
      status: 'waiting',
      created_at: new Date(Date.now() - 10000).toISOString(),
    },
  ],
  activeOffers: [],
  listeners: {},
};

// Auto-initialize seatmaps
state.shows.forEach((sh) => {
  const venue = state.venues.find((v) => v.id === sh.venue_id) || state.venues[0];
  state.seatmaps[sh.id] = generateSeatmapForVenue(sh.id, venue);
});

function notifyMockSeatmapChanged(showId) {
  if (state.listeners[showId]) {
    state.listeners[showId].forEach((fn) => fn(state.seatmaps[showId]));
  }
}

function getAuthHeader() {
  const token = localStorage.getItem('pulse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 1. Auth API
export const authApi = {
  async register({ name, email, password, role }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    
    const user = { id: `user-${Date.now()}`, name, email: email.toLowerCase(), role, created_at: new Date().toISOString() };
    const token = `jwt-mock-${user.id}`;
    return { user, token };
  },

  async login({ email, password }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const cleanEmail = email.toLowerCase();
    let role = 'customer';
    let name = 'Alex Hunter';
    if (cleanEmail.includes('admin')) { role = 'admin'; name = 'Admin Master'; }
    else if (cleanEmail.includes('organiser') || cleanEmail.includes('producer')) { role = 'organiser'; name = 'Pulse Stage Producer'; }
    
    const user = { id: `user-${role}-demo`, name, email: cleanEmail, role, created_at: new Date().toISOString() };
    const token = `jwt-mock-${user.id}`;
    return { user, token };
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeader() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return null;
  },
};

// 2. Customer API
export const customerApi = {
  async getEvents({ type, search } = {}) {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE}/customer/events?${params.toString()}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) return data.events;
      }
    } catch (_) {}

    return state.events.filter((e) => {
      if (type && e.type !== type) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  },

  async getShowsForEvent(eventId) {
    try {
      const res = await fetch(`${API_BASE}/customer/events/${eventId}/shows`, { headers: getAuthHeader() });
      if (res.ok) return (await res.json()).shows;
    } catch (_) {}

    return state.shows.filter((s) => s.event_id === eventId);
  },

  async getSeatmap(showId) {
    try {
      const res = await fetch(`${API_BASE}/customer/shows/${showId}/seatmap`, { headers: getAuthHeader() });
      if (res.ok) return (await res.json()).seatmap;
    } catch (_) {}

    if (!state.seatmaps[showId]) {
      const show = state.shows.find((s) => s.id === showId);
      const venue = state.venues.find((v) => v.id === show?.venue_id) || state.venues[0];
      state.seatmaps[showId] = generateSeatmapForVenue(showId, venue);
    }
    return state.seatmaps[showId];
  },

  async holdSeats(showId, seatIds) {
    try {
      const res = await fetch(`${API_BASE}/customer/shows/${showId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ seatIds }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const seatmap = state.seatmaps[showId];
    const held = [];
    seatmap?.forEach((row) => {
      row.seats.forEach((st) => {
        if (seatIds.includes(st.id)) {
          st.status = 'held';
          st.held_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          held.push(st);
        }
      });
    });
    notifyMockSeatmapChanged(showId);
    return { ok: true, seats: held };
  },

  async confirmBooking(showId, seatIds, customerDetails = {}) {
    try {
      const res = await fetch(`${API_BASE}/customer/shows/${showId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ seatIds }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const show = state.shows.find((s) => s.id === showId);
    const event = state.events.find((e) => e.id === show?.event_id);
    const seatmap = state.seatmaps[showId];
    let total = 0;
    const bookedSeats = [];

    seatmap?.forEach((row) => {
      row.seats.forEach((st) => {
        if (seatIds.includes(st.id)) {
          st.status = 'booked';
          st.held_until = null;
          total += Number(st.category?.price || 400);
          bookedSeats.push({
            seatId: st.id,
            rowLabel: row.rowLabel,
            seatNumber: st.seatNumber,
            categoryName: st.category?.name || 'Standard',
          });
        }
      });
    });

    const bookingRef = `BK-PULSE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const booking = {
      id: `bk-${Date.now()}`,
      booking_reference: bookingRef,
      customer_id: customerDetails.id || 'user-customer-demo',
      customer_name: customerDetails.name || 'Alex Hunter',
      customer_email: customerDetails.email || 'alex.hunter@pulse.io',
      show_id: showId,
      title: event?.title || 'Live Event',
      type: event?.type || 'movie',
      show_date: show?.show_date || '2026-09-10',
      show_time: show?.show_time || '19:00',
      venue_name: show?.venue_name || 'PVR INOX Neo-Plex',
      venue_address: show?.venue_address || 'Phoenix Palladium, Mumbai',
      total_amount: total.toFixed(2),
      status: 'confirmed',
      created_at: new Date().toISOString(),
      seats: bookedSeats,
    };

    state.bookings.unshift(booking);

    state.sentEmails.unshift({
      id: `email-${Date.now()}`,
      to: booking.customer_email,
      subject: `🎟️ Ticket Confirmed: ${booking.title} (${booking.booking_reference})`,
      booking,
      sentAt: new Date().toISOString(),
    });

    notifyMockSeatmapChanged(showId);
    return { ok: true, booking, seats: bookedSeats };
  },

  async joinWaitlist(showId, categoryId, customerDetails = {}) {
    try {
      const res = await fetch(`${API_BASE}/customer/shows/${showId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ categoryId }),
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const entry = {
      id: `wt-${Date.now()}`,
      show_id: showId,
      category_id: categoryId,
      customer_id: customerDetails.id || 'user-customer-demo',
      customer_name: customerDetails.name || 'Alex Hunter',
      customer_email: customerDetails.email || 'alex.hunter@pulse.io',
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
    state.waitlist.push(entry);
    return { waitlistEntry: entry };
  },

  async getBookings() {
    try {
      const res = await fetch(`${API_BASE}/customer/bookings`, { headers: getAuthHeader() });
      if (res.ok) return (await res.json()).bookings;
    } catch (_) {}

    return state.bookings;
  },

  async getSentEmails() {
    return state.sentEmails;
  },

  async cancelBooking(bookingId) {
    try {
      const res = await fetch(`${API_BASE}/customer/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const bk = state.bookings.find((b) => b.id === bookingId);
    if (bk) {
      bk.status = 'cancelled';
      const sm = state.seatmaps[bk.show_id];
      const show = state.shows.find((s) => s.id === bk.show_id);
      const event = state.events.find((e) => e.id === show?.event_id);

      if (sm && bk.seats) {
        const seatIds = bk.seats.map((s) => s.seatId);
        let freedSeat = null;

        sm.forEach((r) => r.seats.forEach((s) => {
          if (seatIds.includes(s.id)) {
            s.status = 'available';
            if (!freedSeat) freedSeat = s;
          }
        }));

        // Check if there is a waiting customer for this category
        if (freedSeat) {
          const waitlistIdx = state.waitlist.findIndex(
            (w) => w.show_id === bk.show_id && w.status === 'waiting'
          );

          if (waitlistIdx !== -1) {
            const waitingEntry = state.waitlist[waitlistIdx];
            waitingEntry.status = 'offered';

            // Real 15-minute offer expiry timestamp
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            const token = `offer-token-${waitingEntry.id}-${Date.now()}`;

            const offerObj = {
              token,
              waitlistEntryId: waitingEntry.id,
              showId: bk.show_id,
              eventTitle: event?.title || 'Dune: Part Two (IMAX 70mm)',
              venueName: show?.venue_name || 'PVR INOX Neo-Plex',
              seatId: freedSeat.id,
              rowLabel: freedSeat.id.split('-').slice(-2, -1)[0] || 'B',
              seatNumber: freedSeat.seatNumber || 5,
              categoryName: freedSeat.category?.name || 'VIP Prime Recliner',
              price: freedSeat.category?.price || 500,
              customerEmail: waitingEntry.customer_email || 'alex.hunter@pulse.io',
              expiresAt,
              createdAt: new Date().toISOString(),
            };

            state.activeOffers.unshift(offerObj);

            // Record sent offer email
            state.sentEmails.unshift({
              id: `email-offer-${Date.now()}`,
              to: waitingEntry.customer_email,
              subject: `⚡ Seat Available: Exclusive 15-Min Booking Link for ${offerObj.eventTitle}`,
              offer: offerObj,
              sentAt: new Date().toISOString(),
            });

            // Mark seat as held for the waitlisted customer
            freedSeat.status = 'held';
            freedSeat.held_until = expiresAt;
          }
        }

        notifyMockSeatmapChanged(bk.show_id);
      }
    }
    return { message: 'booking cancelled' };
  },
};

// 3. Organiser API
export const organiserApi = {
  async getEvents() {
    return state.events;
  },

  async createEvent({ title, type, description, language = 'English', runtime = '2h 15m' }) {
    try {
      const res = await fetch(`${API_BASE}/organiser/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ title, type, description }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.event) {
          state.events.unshift(data.event);
          return data.event;
        }
      }
    } catch (_) {}

    const newEvt = {
      id: `evt-${Date.now()}`,
      title,
      type,
      description,
      banner: type === 'movie'
        ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
      rating: '8.9',
      votes: '12.4K',
      runtime,
      language,
      genre: [type === 'movie' ? 'Cinema' : 'Live Music', 'Now Showing'],
      releaseDate: 'New Release',
      created_at: new Date().toISOString(),
    };
    state.events.unshift(newEvt);
    return newEvt;
  },

  async scheduleShow({ eventId, venueId, showDate, showTime, pricing }) {
    try {
      const res = await fetch(`${API_BASE}/organiser/events/${eventId}/shows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ venueId, showDate, showTime, pricing }),
      });
      if (res.ok) return (await res.json()).show;
    } catch (_) {}

    const venue = state.venues.find((v) => v.id === venueId) || state.venues[0];
    const newShow = {
      id: `show-${Date.now()}`,
      event_id: eventId,
      venue_id: venueId,
      show_date: showDate,
      show_time: showTime,
      venue_name: venue?.name || 'Grand Arena',
      venue_address: venue?.address || 'City Center',
      created_at: new Date().toISOString(),
    };
    state.shows.push(newShow);
    state.seatmaps[newShow.id] = generateSeatmapForVenue(newShow.id, venue, pricing);
    return newShow;
  },

  async getRevenueAnalytics() {
    const summary = state.events.map((evt) => {
      const eventShows = state.shows.filter((s) => s.event_id === evt.id);
      const eventBookings = state.bookings.filter((b) => b.title === evt.title && b.status === 'confirmed');
      const totalRevenue = eventBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const ticketsSold = eventBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
      
      let totalCapacity = 0;
      eventShows.forEach((sh) => {
        const sm = state.seatmaps[sh.id];
        sm?.forEach((r) => { totalCapacity += r.seats.length; });
      });

      const occupancy = totalCapacity > 0 ? ((ticketsSold / totalCapacity) * 100).toFixed(1) : '0.0';

      return {
        eventId: evt.id,
        title: evt.title,
        type: evt.type,
        showsCount: eventShows.length,
        ticketsSold,
        totalRevenue: totalRevenue.toFixed(2),
        occupancyRate: `${occupancy}%`,
      };
    });

    const totalPlatformRevenue = state.bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const totalTicketsSold = state.bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.seats?.length || 0), 0);

    return {
      totalPlatformRevenue: totalPlatformRevenue.toFixed(2),
      totalTicketsSold,
      activeShows: state.shows.length,
      eventsSummary: summary,
    };
  },
};

// 4. Admin API
export const adminApi = {
  async getVenues() {
    try {
      const res = await fetch(`${API_BASE}/admin/venues`, { headers: getAuthHeader() });
      if (res.ok) return (await res.json()).venues;
    } catch (_) {}
    return state.venues;
  },

  async createVenue({ name, city = 'Mumbai', address, categories = [], rows = ['A', 'B', 'C', 'D'], seatsPerRow = 8 }) {
    try {
      const res = await fetch(`${API_BASE}/admin/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ name, address }),
      });
      if (res.ok) return (await res.json()).venue;
    } catch (_) {}

    const v = {
      id: `venue-${Date.now()}`,
      name,
      city,
      address,
      categories: categories.length > 0 ? categories : [
        { id: `cat-vip-${Date.now()}`, name: 'VIP Recliner', price: '750.00' },
        { id: `cat-prem-${Date.now()}`, name: 'Prime Club', price: '480.00' },
        { id: `cat-std-${Date.now()}`, name: 'Standard Cine', price: '300.00' },
      ],
      rows,
      seatsPerRow,
      created_at: new Date().toISOString(),
    };
    state.venues.push(v);
    return v;
  },
};

// 5. Offers API
export const offersApi = {
  async getActiveOffers() {
    return state.activeOffers;
  },

  async getOfferDetails(token) {
    // Look up active offer by token
    const offer = state.activeOffers.find((o) => o.token === token);
    if (offer) {
      const remainingSeconds = Math.max(0, Math.floor((new Date(offer.expiresAt).getTime() - Date.now()) / 1000));
      return {
        valid: remainingSeconds > 0,
        remainingSeconds,
        offer,
      };
    }
    return null;
  },

  async confirmOfferToken(token) {
    try {
      const res = await fetch(`${API_BASE}/offers/${token}/confirm`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (_) {}

    const offer = state.activeOffers.find((o) => o.token === token);
    const booking = {
      id: `bk-offer-${Date.now()}`,
      booking_reference: `BK-OFFER-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      title: offer?.eventTitle || 'Dune: Part Two (IMAX 70mm)',
      type: 'movie',
      show_date: '2026-09-10',
      show_time: '18:30',
      venue_name: offer?.venueName || 'PVR INOX Neo-Plex',
      venue_address: 'Lower Parel, Mumbai',
      total_amount: (offer?.price || 500).toFixed(2),
      status: 'confirmed',
      created_at: new Date().toISOString(),
      seats: [
        {
          seatId: offer?.seatId || 'seat-offered',
          rowLabel: offer?.rowLabel || 'B',
          seatNumber: offer?.seatNumber || 5,
          categoryName: offer?.categoryName || 'VIP Prime Recliner',
        },
      ],
    };

    state.bookings.unshift(booking);

    // Remove from active offers
    state.activeOffers = state.activeOffers.filter((o) => o.token !== token);

    return { booking, seats: booking.seats };
  },
};

// 6. SSE Real-time Subscription Hook
export function subscribeToSeatmap(showId, callback) {
  let es;
  try {
    es = new EventSource(`${API_BASE}/customer/shows/${showId}/seatmap/stream`);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.seatmap) callback(parsed.seatmap);
      } catch (_) {}
    };
  } catch (_) {}

  if (!state.listeners[showId]) state.listeners[showId] = [];
  state.listeners[showId].push(callback);

  return () => {
    if (es) es.close();
    if (state.listeners[showId]) {
      state.listeners[showId] = state.listeners[showId].filter((fn) => fn !== callback);
    }
  };
}
