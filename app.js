import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import connectDB from './db.js';
import User from './models/User.js';
import Question from './models/Question.js';
import Goal from './models/Goal.js';
connectDB();
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.get('/', (req, res) => {
  res.render('home', { session: req.session });
});

app.get('/register', (req, res) => {
  res.render('register', { session: req.session });
});

app.post('/register', upload.single('profilePic'), async (req, res) => {
  const { username, password, email, branch } = req.body;
  const profilePic = req.file ? req.file.filename : 'default-dp.png';

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send('User already exists.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      branch,
      profilePic: profilePic
    });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/profile');
  } catch (err) {
    console.error('Registration error:', err);
    res.send('An error occurred during registration.');
  }
});

app.get('/login', (req, res) => {
  res.render('login', { session: req.session });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/profile');
  } else {
    res.send('Invalid username or password.');
  }
});
app.get('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const userId = req.session.userId;
  const user = await User.findById(userId).lean();
  const questions = await Question.find({ user_id: userId }).lean();

  const topicCounts = {};
  questions.forEach(q => {
    if (q.topic) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }
  });
  const goal = await Goal.findOne({ user_id: userId }).lean();
  if (goal) {
    let since = new Date();
    if (goal.type === 'day') {
      since.setHours(0, 0, 0, 0);
    } else if (goal.type === 'week') {
      const day = since.getDay();
      since.setDate(since.getDate() - day);
      since.setHours(0, 0, 0, 0);
    } else if (goal.type === 'month') {
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
    }

    const progress = await Question.countDocuments({
      user_id: userId,
      createdAt: { $gte: since }
    });

    goal.progress = progress;
  }

  const error = req.query.error ? 'Profile update failed. Please try again.' : null;

  res.render('profile', {
    user,
    questions,
    session: req.session,
    error,
    topicCounts,
    goal
  });
});

app.post('/add-question', async (req, res) => {
  const { question, link, topic, level } = req.body;
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');
  await new Question({ user_id: userId, question, link, topic, level }).save();
  res.redirect('/profile');
});

app.post('/edit-profile', upload.single('profile_pic'), async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const userId = req.session.userId;
  const { username } = req.body;
  const existing = await User.findOne({ username, _id: { $ne: userId } });
  if (existing) {
    return res.redirect('/profile?error=Username+already+taken.');
  }
  const updateData = { username };
  if (req.file) {
    updateData.profile_pic = req.file.filename;
  }
  try {
    await User.findByIdAndUpdate(userId, updateData);
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/profile?error=Profile+update+failed.+Please+try+again.');
  }
});

app.post('/edit-question', async (req, res) => {
  const { id, question, link, topic, level } = req.body;
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');
  await Question.updateOne({ _id: id, user_id: userId }, { question, link, topic, level });
  res.redirect('/profile');
});
app.post('/delete-question', async (req, res) => {
  const { id } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.redirect('/login');
  if (!id) return res.status(400).send("Question ID is missing.");

  try {
    await Question.deleteOne({ _id: id, user_id: userId });
    res.redirect('/profile');
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Failed to delete question.");
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.post('/set-goal', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const userId = req.session.userId;
  const { type, count } = req.body;
  await Goal.findOneAndUpdate(
    { user_id: userId },
    { type, count },
    { upsert: true }
  );
  res.redirect('/profile');
});

app.post('/reset-goal', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  await Goal.deleteOne({ user_id: req.session.userId });
  res.redirect('/profile');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
