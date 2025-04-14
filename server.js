const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // Import helmet for security headers
const logger = require('./logger'); // Your Winston logger
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const cors = require('cors'); // Import CORS
const app = express();
const port = 5000;

const corsOptions = {
    origin: 'http://localhost:5173', // Change to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

app.use(cors(corsOptions));

// Use Helmet to set security-related HTTP headers
app.use(helmet());

// Middleware to parse JSON request bodies
app.use(express.json());

// Use cookie parser for CSRF protection
app.use(cookieParser());

// Setup CSRF protection with cookies
const csrfProtection = csrf({ cookie: true });

// Expose a route to fetch the CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Setup Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => logger.info('✅ MongoDB connected'))
  .catch(err => {
    logger.error('❌ MongoDB connection error: %s', err);
    process.exit(1);
  });

// Routes
const bugRoutes = require('./routes/bugs');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api/bugs', bugRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Global Error: %s', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bug Tracker API',
      version: '1.0.0',
      description: 'API documentation for the Bug Tracker application',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
    components: {
      schemas: {
        Bug: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '607d1b2f5311236168a109ca',
            },
            title: {
              type: 'string',
              example: 'UI glitch on login screen',
            },
            description: {
              type: 'string',
              example: 'The login button disappears when the window is resized.',
            },
            priority: {
              type: 'string',
              enum: ['Low', 'Medium', 'High'],
              example: 'High',
            },
            reporter: {
              type: 'string',
              example: 'john_doe',
            },
            assignedTo: {
              type: 'string',
              example: 'dev_team',
            },
            status: {
              type: 'string',
              enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
              example: 'Open',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-04-01T14:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-04-03T12:00:00Z',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Your route files where Swagger comments live
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
// Swagger UI Route (after all routes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


