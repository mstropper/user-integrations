const request = require('supertest');
const app = require('./server');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'secreto';

describe('User Management API', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: '123456' });
    token = res.body.token;
  });

  describe('POST /login', () => {
    it('should return a JWT token for valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'admin', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      const decoded = jwt.verify(res.body.token, SECRET_KEY);
      expect(decoded.username).toBe('admin');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciais inválidas');
    });
  });

  describe('GET /users', () => {
    it('should return a list of users with valid token', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 for missing or invalid token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Acesso negado, token não fornecido');
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const newUser = { name: 'John Doe', email: 'john.doe@example.com' };
      const res = await request(app)
        .post('/users')
        .send(newUser)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newUser.name);
      expect(res.body.email).toBe(newUser.email);
    });

    it('should return 400 if name or email is missing', async () => {
      const res = await request(app)
        .post('/users')
        .send({ name: 'John Doe' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome e e-mail são obrigatórios.');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update an existing user', async () => {
    
      const resCreate = await request(app)
        .post('/users')
        .send({ name: 'Jane Doe', email: 'jane.doe@example.com' })
        .set('Authorization', `Bearer ${token}`);

      const userId = resCreate.body.id;

      const resUpdate = await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Jane Updated', email: 'jane.updated@example.com' })
        .set('Authorization', `Bearer ${token}`);

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.name).toBe('Jane Updated');
      expect(resUpdate.body.email).toBe('jane.updated@example.com');
    });

    it('should return 404 for user not found', async () => {
      const res = await request(app)
        .put('/users/999') 
        .send({ name: 'Non-existent User', email: 'non.existent@example.com' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Usuário não encontrado.');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete an existing user', async () => {
      const resCreate = await request(app)
        .post('/users')
        .send({ name: 'Mark Smith', email: 'mark.smith@example.com' })
        .set('Authorization', `Bearer ${token}`);

      const userId = resCreate.body.id;

      const resDelete = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(resDelete.status).toBe(204);
    });

    it('should return 404 for user not found', async () => {
      const res = await request(app)
        .delete('/users/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
