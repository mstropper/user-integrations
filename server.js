const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'API para gerenciar usuários com autenticação JWT',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'secreto';

app.use(express.json());

let users = [];
let nextId = 1;
const validUser = { username: 'admin', password: '123456' };

function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Acesso negado, token não fornecido' });
    
    jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autenticação do usuário
 *     description: Retorna um token JWT para autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username !== validUser.username || password !== validUser.password) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retorna a lista de usuários
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 */

app.get('/users', authenticateToken, (req, res) => {
    res.json(users);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Nome e e-mail são obrigatórios
 */

app.post('/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }
    
    const newUser = { id: nextId++, name, email };
    users.push(newUser);
    res.status(201).json(newUser);
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário existente
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */

app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const userIndex = users.findIndex(user => user.id === parseInt(id));
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }
    
    users[userIndex] = { id: parseInt(id), name, email };
    res.json(users[userIndex]);
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove um usuário existente
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuário removido com sucesso
 *       404:
 *         description: Usuário não encontrado
 */

app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex(user => user.id === parseInt(id));

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  users.splice(userIndex, 1);
  res.status(204).send();
});


if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;