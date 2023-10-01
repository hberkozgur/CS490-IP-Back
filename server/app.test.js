const request = require('supertest');

const app = require('./app.js'); // Import your Express app



describe('GET /movies', () => {
  it('responds with JSON containing a list of movies', async () => {
    const response = await request(app).get('/movies');
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format
    expect(response.body).toBeInstanceOf(Array); // Check if the response body is an array
  });
});
  describe('GET /actors', () => {
    it('responds with JSON containing a list of actors', async () => {
      const response = await request(app).get('/actors');
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.body).toBeInstanceOf(Array);
  
      // Additional assertions for specific data or structure expectations
      const actors = response.body;
      expect(actors.length).toBeGreaterThan(0); // Check if the array is not empty
  
      // Example: Check if each actor has specific properties (e.g., actor_id, first_name, last_name)
      actors.forEach((actor) => {
        expect(actor).toHaveProperty('actor_id');
        expect(actor).toHaveProperty('first_name');
        expect(actor).toHaveProperty('last_name');
      });
    });
  });
  describe('GET /movies/:movieId', () => {
  it('responds with JSON containing movie details for a valid movie ID', async () => {
    // Replace 'validMovieId' with an actual valid movie ID from your database
    const validMovieId = 1;

    const response = await request(app).get(`/movies/${validMovieId}`);
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const movieDetails = response.body;

    // Add more specific assertions based on your database schema and expected movie details
    expect(movieDetails).toHaveProperty('film_id');
    expect(movieDetails).toHaveProperty('title');
    expect(movieDetails).toHaveProperty('description');
    expect(movieDetails).toHaveProperty('genre');
    // Add more assertions for other movie details as needed
  });

  // Add additional tests for handling invalid movie IDs, 404 responses, etc. as needed
});