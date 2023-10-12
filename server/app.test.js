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
  

      const actors = response.body;
      expect(actors.length).toBeGreaterThan(0); 

      actors.forEach((actor) => {
        expect(actor).toHaveProperty('actor_id');
        expect(actor).toHaveProperty('first_name');
        expect(actor).toHaveProperty('last_name');
      });
    });
  });
  describe('GET /movies/:movieId', () => {
  it('responds with JSON containing movie details for a valid movie ID', async () => {

    const validMovieId = 1;

    const response = await request(app).get(`/movies/${validMovieId}`);
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const movieDetails = response.body;


    expect(movieDetails).toHaveProperty('film_id');
    expect(movieDetails).toHaveProperty('title');
    expect(movieDetails).toHaveProperty('description');
    expect(movieDetails).toHaveProperty('genre');

  });
  describe('GET /customers', () => {
    it('responds with JSON containing a list of customers', async () => {
      const response = await request(app).get('/customers');
      expect(response.status).toBe(200); // Assuming a successful request returns status code 200
      expect(response.type).toBe('application/json'); // Ensure the response is in JSON format
  
      const customers = response.body;
  

      expect(Array.isArray(customers)).toBe(true); // Expecting an array of customers
      expect(customers.length).toBeGreaterThan(0); // Expecting at least one customer in the list
  

      customers.forEach((customer) => {
        expect(customer).toHaveProperty('customer_id');
        expect(customer).toHaveProperty('first_name');
        expect(customer).toHaveProperty('last_name');

      });
    });
  });
  

});
describe('GET /customers/:customerId', () => {
  it('responds with JSON containing customer details for a valid customer ID', async () => {

    const validCustomerId = 1;

    const response = await request(app).get(`/customers/${validCustomerId}`);
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const customerDetails = response.body;


    expect(customerDetails).toHaveProperty('customer_id');
    expect(customerDetails).toHaveProperty('first_name');
    expect(customerDetails).toHaveProperty('last_name');

  });


});
describe('PUT /customers/:customerId/edit', () => {
  it('responds with success message after editing customer information', async () => {
    const validCustomerId = 1;
    const updatedCustomerInfo = {
      first_name: 'UpdatedFirstName',
      last_name: 'UpdatedLastName',
      email: 'updated@example.com',
    };

    const response = await request(app)
      .put(`/customers/${validCustomerId}/edit`)
      .send(updatedCustomerInfo);

    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const responseBody = response.body;
    expect(responseBody).toEqual({ success: true, message: 'Customer information updated successfully' });
  });


});
describe('GET /actors/:actorId', () => {
  it('responds with actor details and top rented movies for a valid actor ID', async () => {

    const validActorId = 1;

    const response = await request(app).get(`/actors/${validActorId}`);
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const actorResponse = response.body;


    expect(actorResponse).toHaveProperty('actor'); // Expecting actor details
    expect(actorResponse).toHaveProperty('topRentedMovies'); // Expecting top rented movies


    expect(actorResponse.actor).toHaveProperty('actor_id');
    expect(actorResponse.actor).toHaveProperty('first_name');
    expect(actorResponse.actor).toHaveProperty('last_name');



    actorResponse.topRentedMovies.forEach((movie) => {
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('rentalCount');

    });
  });
});
describe('GET /movies_all', () => {
  it('responds with a list of movies based on search term', async () => {

    const searchTerm = 'Action';

    const response = await request(app).get(`/movies_all?searchTerm=${searchTerm}`);
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const moviesList = response.body;


    expect(Array.isArray(moviesList)).toBe(true); // Expecting an array of movies


    moviesList.forEach((movie) => {
      expect(movie).toHaveProperty('film_id');
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('description');
      expect(movie).toHaveProperty('genre');
      expect(movie).toHaveProperty('actors');

    });
  });
});

describe('GET /customers/:customerId/rented-movies', () => {
  it('responds with a list of rented movies for a valid customer ID', async () => {
    const validCustomerId = 1;

    const response = await request(app).get(`/customers/${validCustomerId}/rented-movies`);
    expect(response.status).toBe(200); // Assuming a successful request returns status code 200
    expect(response.type).toBe('application/json'); // Ensure the response is in JSON format

    const rentedMovies = response.body;

    expect(Array.isArray(rentedMovies)).toBe(true); // Expecting an array of rented movies

    rentedMovies.forEach((movie) => {
      expect(movie).toHaveProperty('film_id');
      expect(movie).toHaveProperty('title');
      
    });
  });
});



describe('POST /new_rent', () => {
  it('rents a movie for a customer', async () => {
    const rentalData = {
      movieId: 1, 
      customerId: 1, 
      staffId: 1, 
    };

    const response = await request(app)
      .post('/new_rent')
      .send(rentalData);

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toHaveProperty('message', 'Rental record inserted successfully');
  });

});

describe('PUT /customers/:customerId/return-movie/:movieId', () => {
  it('returns a rented movie for a customer', async () => {
    const response = await request(app).put('/customers/1/return-movie/1'); 

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toHaveProperty('message', 'Rental record updated successfully');
  });

  it('handles the case where no valid rental record is found', async () => {
    const response = await request(app).put('/customers/1/return-movie/9999'); 

    expect(response.status).toBe(404);
    expect(response.type).toBe('application/json');
    expect(response.body).toHaveProperty('error', 'No valid rental record found');
  });
});
