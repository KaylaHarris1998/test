import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { config, validateEnvironment } from "./config/environment.js"
import { testConnection, initializeDatabase } from "./config/Database.js"
import userRouter from "./routes/user.routes.js"
import organizationRouter from "./routes/organization.routes.js"
import keyRouter from "./routes/key.routes.js"
import locationRouter from "./routes/location.routes.js"
// import analysisRouter from "./routes/analysis.routes.js"
// import typeRouter from "./routes/type.routes.js"
// import sourceRouter from "./routes/source.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"
// import managerDashboardRouter from "./routes/Manager/dashboard.routes.js"
// import managerUserRouter from "./routes/Manager/user.routes.js"

import path from "path"
import { fileURLToPath } from "url"

const currentFilePath = fileURLToPath(import.meta.url)
dotenv.config()

// Validate environment variables
validateEnvironment()

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Body parsing middleware
app.use(cookieParser())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }))
app.use(bodyParser.json({ limit: "10mb" }))

// import { getTranscriptionProgress } from './controllers/Transcribes.js'

// app.use("/api/analysis", analysisRouter)
// app.use("/api/types", typeRouter)
// app.use("/api/sources", sourceRouter)
// app.use("/api/dashboard", dashboardRouter)
// app.use("/api/manager/dashboard", managerDashboardRouter)
// app.use("/api/manager/users", managerUserRouter)
// app.get("/api/transcription/progress", getTranscriptionProgress)

// Static files
app.use("/uploads", express.static("uploads"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv
  })
})


app.use(
  express.static(path.join(path.dirname(currentFilePath), "../nabl-web/build"))
)

// Catch-all route for frontend
app.get("*", (req, res) => {
  res.sendFile(
    path.join(path.dirname(currentFilePath), "../nabl-web/build", "index.html")
  )
})

app.use((err, req, res, next) => {
  console.error('Global error handler:', err)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access'
    })
  }
  
  res.status(500).json({
    success: false,
    message: config.server.nodeEnv === 'production' 
      ? 'Internal server error' 
      : err.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

const PORT = config.server.port

const startServer = async () => {
  try {
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server will not start.')
      process.exit(1)
    }

    await initializeDatabase(false)

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at port ${PORT}`)
      console.log(`🌍 Environment: ${config.server.nodeEnv}`)
      console.log(`📡 API available at http://localhost:${PORT}/api`)
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...')
  process.exit(0)
})

startServer()