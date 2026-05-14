
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000; 

const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json()); 


app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'MentorConnect API is running successfully!',
    registration_endpoint: 'POST /api/register',
    login_endpoint: 'POST /api/login' 
  });
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/MentorConnect'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  role: { type: String, required: true, enum: ['mentee', 'mentor'] },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Track mentee login events for mentors to view
const LoginEventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  role: { type: String, required: true, enum: ['mentee', 'mentor'] },
  createdAt: { type: Date, default: Date.now, index: true }
});
const LoginEvent = mongoose.model('LoginEvent', LoginEventSchema);

// Feedback from mentees to mentors
const FeedbackSchema = new mongoose.Schema({
  menteeEmail: { type: String, required: true, index: true },
  menteeName: { type: String, required: true },
  mentorEmail: { type: String, required: true, index: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', FeedbackSchema);


app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const normalizedEmail = String(email).toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({ message: 'Account created successfully!' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
  
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      
      return res.status(401).json({ message: 'Invalid credentials.' }); 
    }


    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    
    const payload = {
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Record mentee login event for mentor dashboards
    if (user.role === 'mentee') {
      try {
        await LoginEvent.create({ name: user.name, email: user.email, role: user.role });
      } catch (e) {
        console.error('Failed to record login event:', e);
      }
    }

    res.status(200).json({ message: 'Login successful!', user: payload });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

// Simple password reset by email (no token, for demo/dev only)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and newPassword are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Enforce mentee-only reset if needed by product rules
    if (user.role !== 'mentee') {
      return res.status(403).json({ message: 'Only mentees can reset password here.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error while resetting password.' });
  }
});

app.get('/api/mentors', async (req, res) => {
    try {
    
        const mentors = await User.find({ role: 'mentor' }, 'name email role'); 

        if (mentors.length === 0) {
            return res.status(404).json({ message: 'No mentors found.' });
        }

        
        res.status(200).json(mentors);

    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ message: 'Server error while fetching mentors.' });
    }
});

// Create feedback (mentee -> mentor)
app.post('/api/feedback', async (req, res) => {
  try {
    const { menteeEmail, menteeName, mentorEmail, message, rating } = req.body;
    if (!menteeEmail || !menteeName || !mentorEmail || !message) {
      return res.status(400).json({ message: 'menteeEmail, menteeName, mentorEmail, message are required.' });
    }
    const doc = await Feedback.create({
      menteeEmail: String(menteeEmail).toLowerCase(),
      menteeName,
      mentorEmail: String(mentorEmail).toLowerCase(),
      message,
      rating
    });
    res.status(201).json({ message: 'Feedback submitted.', feedback: doc });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Server error while submitting feedback.' });
  }
});

// List feedback for a mentor
app.get('/api/feedback', async (req, res) => {
  try {
    const mentorEmail = String(req.query.mentorEmail || '').toLowerCase();
    if (!mentorEmail) return res.status(400).json({ message: 'mentorEmail query is required.' });
    const list = await Feedback.find({ mentorEmail }).sort({ createdAt: -1 }).lean();
    res.status(200).json(list);
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({ message: 'Server error while fetching feedback.' });
  }
});

// List all mentees (simple demo; consider pagination and auth)
app.get('/api/mentees', async (req, res) => {
  try {
    const mentees = await User.find({ role: 'mentee' }, 'name email role').lean();
    res.status(200).json(mentees);
  } catch (error) {
    console.error('Error fetching mentees:', error);
    res.status(500).json({ message: 'Server error while fetching mentees.' });
  }
});

// Recent mentee logins list (simple, unauthenticated for demo dev)
app.get('/api/mentee-logins', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const events = await LoginEvent.find({ role: 'mentee' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.status(200).json(events);
  } catch (error) {
    console.error('Fetch mentee logins error:', error);
    res.status(500).json({ message: 'Server error while fetching mentee logins.' });
  }
});


app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.put("/api/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  if (!process.env.MONGO_URI) {
    console.log('Warning: using local MongoDB. Set MONGO_URI for production.');
  }
  if (allowedOrigin !== '*') {
    console.log(`CORS restricted to origin: ${allowedOrigin}`);
  } else {
    console.log('CORS allows all origins. Configure CORS_ORIGIN for production.');
  }
});
