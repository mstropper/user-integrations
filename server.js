const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let users = [];
let nextId = 1;

// Rota para obter todos os usuários
app.get('/users', (req, res) => {
  res.json(users);
});

// Rota para adicionar um novo usuário
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  const newUser = { id: nextId++, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Rota para atualizar um usuário pelo ID
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

// Rota para remover um usuário pelo ID
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter(user => user.id !== parseInt(id));
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
