const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const authService = require('../src/services/authService');
const venueService = require('../src/services/venueService');
const eventService = require('../src/services/eventService');

describe('concurrent seat hold', () => {
  let showId;
  let seatId;
  let customerTokens;

  beforeAll(async () => {
    const suffix = Date.now();

    const admin = await authService.createUser({
      name: 'Concurrency Admin',
      email: `concurrency-admin-${suffix}@test.com`,
      password: 'pass1234',
      role: 'admin',
    });
    const venue = await venueService.createVenue({
      adminId: admin.id,
      name: 'Concurrency Test Venue',
      address: 'Test',
    });
    const category = await venueService.createCategory(venue.id, 'General');
    await venueService.bulkCreateSeats(venue.id, [
      { categoryId: category.id, rowLabel: 'A', seatNumber: 1 },
    ]);

    const organiser = await authService.createUser({
      name: 'Concurrency Organiser',
      email: `concurrency-organiser-${suffix}@test.com`,
      password: 'pass1234',
      role: 'organiser',
    });
    const event = await eventService.createEvent({
      organiserId: organiser.id,
      title: 'Concurrency Test Event',
      type: 'movie',
      description: '',
    });
    const show = await eventService.createShow({
      eventId: event.id,
      venueId: venue.id,
      showDate: '2026-12-01',
      showTime: '20:00',
      pricing: [{ categoryId: category.id, price: 100 }],
    });
    showId = show.id;

    const seatmap = await eventService.getShowSeatmap(showId);
    seatId = seatmap[0].seats[0].id;

    customerTokens = [];
    for (let i = 0; i < 5; i++) {
      const customer = await authService.createUser({
        name: `Concurrency Customer ${i}`,
        email: `concurrency-customer-${i}-${suffix}@test.com`,
        password: 'pass1234',
        role: 'customer',
      });
      customerTokens.push(authService.issueToken(customer));
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  test('exactly one of five simultaneous hold requests on the same seat succeeds', async () => {
    const responses = await Promise.all(
      customerTokens.map((token) =>
        request(app)
          .post(`/customer/shows/${showId}/hold`)
          .set('Authorization', `Bearer ${token}`)
          .send({ seatIds: [seatId] })
      )
    );

    const successes = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(4);
  });
});
