import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { pool } from './db.js';
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

app.post('/register', upload.single('profile_pic'), async (req, res) => {
  const { username, password, email, branch } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const profilePic = req.file ? req.file.filename : 'default-dp.png';

  try {
    await pool.query(`
      INSERT INTO users (username, password, email, branch, profile_pic)
      VALUES ($1, $2, $3, $4, $5)
    `, [username, hashed, email, branch, profilePic]);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('User already exists or error occurred.');
  }
});
app.get('/login', (req, res) => {
  res.render('login', { session: req.session });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/profile');
  } else {
    res.send('Invalid username or password.');
  }
});
app.get('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const userId = req.session.userId;

  const userResult = await pool.query(`
    SELECT username, email, branch, profile_pic
    FROM users WHERE id = $1
  `, [userId]);
  const user = userResult.rows[0];

  const questions = await pool.query('SELECT * FROM questions WHERE user_id = $1', [userId]);

  // Topic count aggregation
  const topicCounts = {};
  questions.rows.forEach(q => {
    if (q.topic) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }
  });

  // Fetch goal
  const goalResult = await pool.query('SELECT * FROM goals WHERE user_id = $1', [userId]);
  let goal = null;
  if (goalResult.rows.length > 0) {
    goal = goalResult.rows[0];
    // Calculate progress
    let since = new Date();
    if (goal.type === 'day') {
      since.setHours(0,0,0,0);
    } else if (goal.type === 'week') {
      const day = since.getDay();
      since.setDate(since.getDate() - day);
      since.setHours(0,0,0,0);
    } else if (goal.type === 'month') {
      since.setDate(1);
      since.setHours(0,0,0,0);
    }
    const progressResult = await pool.query(
      'SELECT COUNT(*) FROM questions WHERE user_id = $1 AND created_at >= $2',
      [userId, since]
    );
    goal.progress = parseInt(progressResult.rows[0].count, 10);
  }

  // Pass error from query param if present
  const error = req.query.error ? 'Profile update failed. Please try again.' : null;

  res.render('profile', {
    user,
    questions: questions.rows,
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
  await pool.query('INSERT INTO questions (user_id, question, link, topic, level) VALUES ($1, $2, $3, $4, $5)', [
    userId, question, link, topic, level
  ]);
  res.redirect('/profile');
});
app.post('/edit-profile', upload.single('profile_pic'), async (req, res) => {
  console.log('POST /edit-profile called'); // Debug log
  if (!req.session.userId) return res.redirect('/login');
  const userId = req.session.userId;
  const { username } = req.body;

  // Check if username is already taken by another user
  const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
  if (existing.rows.length > 0) {
    return res.redirect('/profile?error=Username+already+taken.');
  }

  let updateQuery = 'UPDATE users SET username = $1';
  let params = [username];

  if (req.file) {
    updateQuery += ', profile_pic = $2 WHERE id = $3';
    params.push(req.file.filename, userId);
  } else {
    updateQuery += ' WHERE id = $2';
    params.push(userId);
  }

  try {
    await pool.query(updateQuery, params);
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
  await pool.query('UPDATE questions SET question = $1, link = $2, topic = $3, level = $4 WHERE id = $5 AND user_id = $6', [
    question, link, topic, level, id, userId
  ]);
  res.redirect('/profile');
});

app.post('/delete-question', async (req, res) => {
  const { id } = req.body;
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');
  await pool.query('DELETE FROM questions WHERE id = $1 AND user_id = $2', [id, userId]);
  res.redirect('/profile');
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
  // Upsert goal
  await pool.query(`
    INSERT INTO goals (user_id, type, count)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET type = $2, count = $3
  `, [userId, type, count]);
  res.redirect('/profile');
});
app.post('/reset-goal', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  await pool.query('DELETE FROM goals WHERE user_id = $1', [req.session.userId]);
  res.redirect('/profile');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

