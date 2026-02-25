import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("exams.db");

// Ma'lumotlar bazasini yaratish (Database initialization)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL -- 'student' yoki 'teacher'
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    student_name TEXT NOT NULL,
    audio_data TEXT NOT NULL,
    score INTEGER,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES users(id)
  );
`);

// Test uchun foydalanuvchilarni yaratish (Seed users for testing)
const seedUsers = () => {
  const teacherExists = db.prepare("SELECT * FROM users WHERE username = ?").get("teacher");
  if (!teacherExists) {
    const hashedPassword = bcrypt.hashSync("teacher123", 10);
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("teacher", hashedPassword, "teacher");
  }
  
  const studentExists = db.prepare("SELECT * FROM users WHERE username = ?").get("student");
  if (!studentExists) {
    const hashedPassword = bcrypt.hashSync("student123", 10);
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("student", hashedPassword, "student");
  }
};
seedUsers();

// Passport konfiguratsiyasi
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (!user) return done(null, false, { message: "Foydalanuvchi topilmadi" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: "Parol noto'g'ri" });
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare("SELECT id, username, role FROM users WHERE id = ?").get(id);
  done(null, user);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(session({
    secret: "secret_key_exam_app",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: 'lax' }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth API
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, username: user.username, role: user.role });
      });
    })(req, res, next);
  });

  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Tizimga kirmagan" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // API: Talaba audio yuborishi (Student submission)
  app.post("/api/submit", (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'student') {
      return res.status(403).json({ error: "Ruxsat berilmagan" });
    }
    const { studentName, audioData } = req.body;
    const studentId = (req.user as any).id;
    
    const stmt = db.prepare("INSERT INTO submissions (student_id, student_name, audio_data) VALUES (?, ?, ?)");
    const info = stmt.run(studentId, studentName, audioData);
    res.json({ id: info.lastInsertRowid });
  });

  // API: Barcha topshiriqlarni olish (Get all submissions for teacher)
  app.get("/api/submissions", (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'teacher') {
      return res.status(403).json({ error: "Ruxsat berilmagan" });
    }
    const submissions = db.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all();
    res.json(submissions);
  });

  // API: Baholash (Grade submission)
  app.post("/api/grade", (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'teacher') {
      return res.status(403).json({ error: "Ruxsat berilmagan" });
    }
    const { id, score, feedback } = req.body;
    const stmt = db.prepare("UPDATE submissions SET score = ?, feedback = ? WHERE id = ?");
    stmt.run(score, feedback, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
