# **AJUs-Elearning-Server**

## **Project Description**

The **AJUs-Elearning-Server** is the backend server for the **AJUs-Elearning** platform, built using the **MERN** stack (MongoDB, Express.js, React.js, Node.js). The server handles core functionalities such as user authentication, course management, assignments, real-time features with Redis caching, and more. The backend is built with **TypeScript** for type safety and better maintainability.

## **Tech Stack**

- **Node.js**: JavaScript runtime for building scalable server-side applications.
- **Express.js**: Web framework for building RESTful APIs and handling HTTP requests.
- **MongoDB**: NoSQL database for storing user, course, and learning data.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB.
- **JWT (JSON Web Tokens)**: For user authentication and authorization.
- **Redis**: Caching layer for improving performance and real-time data features.
- **TypeScript**: Provides type safety and enhances code quality and development speed.
- **bcryptjs**: For securely hashing and verifying passwords.
- **cookie-parser**: Middleware for parsing cookies.
- **dotenv**: For managing environment variables.
- **cors**: Middleware to enable Cross-Origin Resource Sharing (CORS) for your APIs.

## **Installed Dependencies**

The following dependencies have been installed for the project:

- **bcryptjs**: A library for hashing passwords securely.
- **cookie-parser**: Middleware for parsing cookies in the server.
- **cors**: Middleware for enabling Cross-Origin Resource Sharing.
- **dotenv**: Loads environment variables from a `.env` file.
- **express**: A minimal and flexible Node.js web application framework.
- **ioredis**: Redis client for connecting and interacting with Redis.
- **jsonwebtoken**: A library for implementing JSON Web Tokens for secure authentication.
- **mongoose**: MongoDB object modeling for Node.js.
- **ts-node-dev**: TypeScript development server for faster reloading.
- **@types/* packages**: Type definitions for TypeScript, including `bcryptjs`, `cookie-parser`, `cors`, `express`, `jsonwebtoken`, and `node`.
- **typescript**: Superset of JavaScript for adding type safety to the code.

## **Features**

- **User Authentication**: Secure login and registration using **JWT**.
- **Course Management**: Admins and educators can create, update, and manage courses.
- **Assignments & Tasks**: Educators can create assignments and tasks for learners, and learners can submit them.
- **Study Plans**: Educators can create study plans, and learners can view their progress.
- **Real-Time Features**: Real-time communication and doubt clarification via **Redis**.
- **Email Notifications**: Automated email responses for task submissions, evaluations, and updates.
- **Admin Panel**: For managing users, courses, assignments, and monitoring progress.
- **TypeScript Support**: Fully typed backend using **TypeScript** for better code safety and maintainability.

## **Setup Instructions**

### **Clone the Repository**
```bash
git clone https://github.com/your-username/AJUs-Elearning-Server.git
cd AJUs-Elearning-Server
```

### **Install Dependencies**
Install the required dependencies with npm:
```bash
npm install
```

### **Environment Variables**
Create a `.env` file in the root directory and add the following environment variables:

```plaintext
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
PORT=5000
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
```

### **Start the Server**
After installing dependencies and configuring the environment variables, run the server:

```bash
npm start
```

The server will run on **http://localhost:5000** by default.

## **Usage**

- The server exposes a set of RESTful APIs for handling authentication, courses, assignments, and more.
- It is designed to integrate seamlessly with a React.js frontend to build a full-stack **Learning Dashboard** platform.
- The backend utilizes **Redis** for caching and performance optimization.

## **Contributing**

We welcome contributions to enhance the features and improve the performance of the AJUs-Elearning platform. To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to your branch (`git push origin feature-name`)
5. Create a new Pull Request

## **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## **Acknowledgments**

- **Express.js** for simplifying the API development.
- **MongoDB** and **Mongoose** for managing data in the backend.
- **Redis** for enhancing performance through caching and real-time capabilities.
- **JWT** for secure authentication.
- **TypeScript** for ensuring code safety and better maintainability.
