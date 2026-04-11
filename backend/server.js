require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const questionRoutes = require("./routes/questionRoutes");
const { protect } = require("./middleware/authMiddleware");
const {
  generateConceptExplanation,
  generateInterviewQuestions,
} = require("./controllers/aiController");

const app = express();

//Middleware to handle CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ai-interviews-preparation.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }),
);

//connect database
connectDB();

//Middleware
app.use(express.json());

//checking route
//home
app.get("/home", (req, res) => {
  res.send("<h1>AI-Interview-Preparation Application</h1>");
});

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/questions", questionRoutes);

app.use("/api/ai/generate-questions", protect, generateInterviewQuestions);
app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);

// Serve static files from uploads folder
// ✅ Fix for CommonJS: define __dirname
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
