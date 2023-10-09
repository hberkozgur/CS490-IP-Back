Setting up and Running the Back-End (Express.js Application)
This documentation provides step-by-step instructions for setting up and running the provided Express.js application on your local machine. The application uses Node.js, Express.js, MySQL, and other dependencies to create a RESTful API for a movie rental service.
Prerequisites
Before you begin, ensure you have the following prerequisites installed on your local machine:
Node.js: You'll need Node.js to run the JavaScript code.
MySQL: You should have a MySQL server installed and running.
npm: This package manager is included with Node.js.
Installation

Install Dependencies:
Install the required Node.js dependencies using npm. Run the following command inside the project directory:
bash
npm install

Configure the Database Connection:
Open the app.js file in your preferred text editor. Locate the following code block:
javascript
// Create a MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123123',
    database: 'sakila',
});
Modify the database connection parameters (host, user, password, database) to match your MySQL database configuration.
Start the Application:
Start the Express.js application by running the following command in the project directory:
bash
npm start
This will start the server, and you should see a message indicating that the server is running on a specific port (e.g., Server is running on port 4000).
Access the Application:
You can access the application by opening a web browser or using an API client (e.g., Postman). The API endpoints exposed by the application are accessible using the following URLs:
Base URL: http://localhost:4000
Using the Application
The Express.js application provides several RESTful API endpoints for interacting with movie rental data. You can use an API client or tools like curl to make HTTP requests to these endpoints.
Here are some of the available endpoints:
/generate-pdf-report: Generate a PDF report of customer rentals.
/movies: Retrieve a list of movies.
/actors: Retrieve a list of top actors based on movie count.
/actors/:actorId: Retrieve details about a specific actor and their top rented movies.
/movies_all: Search for movies by title, actor, or genre.
/movies/:movieId: Retrieve details about a specific movie.
/customers/:customerId/rented-movies: Retrieve rented movies for a specific customer.
/customers/:customerId: Retrieve details about a specific customer.
/delete/customers/:customerId: Delete a customer and related rental records.
/new_rent: Rent a movie by providing movieId, customerId, and staffId.
/customers/:customerId/return-movie/:movieId: Mark a rented movie as returned.
/customers_rents: Retrieve customer rental data to be generated as pdf.
/customers: Retrieve a list of customers.
/add-customer: Add a new customer to the database.
/customers/:customerId/edit: Edit customer information.

