
// Importar dependencias principales
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// Crear instancia de la app
const app = express();

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Configurar motor de vistas y carpeta
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para JSON y formularios HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.BD || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Ruta raíz redirigiendo a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Mostrar formulario registro
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Procesar registro de usuario
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hash]);
    res.redirect('/login');
  } catch (e) {
    console.error('Error en registro:', e);
    res.render('register', { error: 'Error registrando usuario. ¿Email ya registrado?' });
  }
});

// Mostrar formulario login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Procesar login de usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.render('login', { error: 'Usuario no encontrado' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render('login', { error: 'Contraseña incorrecta' });

    // Crear token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    // Mostrar token (en app real, guardar en cookie o localStorage)
    res.send(`
      <h1>Bienvenido, ${user.email}</h1>
      <p>Tu token JWT (válido 1 hora):</p>
      <textarea style="width:100%;height:100px;">${token}</textarea>
      <p><a href="/private?token=${token}">Ir a ruta protegida</a></p>
    `);
  } catch (e) {
    console.error('Error en login:', e);
    res.render('login', { error: 'Error interno' });
  }
});

// Middleware para verificar token JWT en query o header Authorization
function verifyToken(req, res, next) {
  let token = null;

  // Buscar token en query (para demo)
  if (req.query.token) {
    token = req.query.token;
  } else if (req.headers['authorization']) {
    const auth = req.headers['authorization'];
    token = auth.split(' ')[1];
  }

  if (!token) return res.status(401).send('Token requerido');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Token inválido');
    req.user = user;
    next();
  });
}

// Ruta protegida, solo accesible con token válido
app.get('/private', verifyToken, (req, res) => {
  res.send(`<h1>Hola, ${req.user.email}. Esta es una ruta protegida.</h1>`);
});

// Ruta para probar conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'success', 
      message: 'Conexión a DB exitosa',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Error conectando a DB',
      error: error.message 
    });
  }
});

// Iniciar el servidor en el puerto configurado
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${port}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
  console.log(`DB configurada: ${process.env.BD ? 'Sí' : 'No'}`);
});