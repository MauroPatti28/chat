const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());

const WORKING_MODELS = [
  {
    name: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    prompt: (input) => `User: ${input}\nAssistant:`
  },
  {
    name: 'google/gemma-7b-it',
    prompt: (input) => `User: ${input}\nAssistant:`
  },
  {
    name: 'HuggingFaceH4/zephyr-7b-beta',
    prompt: (input) => `User: ${input}\nAssistant:`
  }
];

async function getHuggingFaceResponse(userInput) {
  const token = process.env.HF_API_KEY;
  if (!token) throw new Error('HF_API_KEY no definido');

  for (const model of WORKING_MODELS) {
    const prompt = model.prompt(userInput);
    try {
      const res = await axios.post(
        `https://api-inference.huggingface.co/models/${model.name}`,
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 12000
        }
      );

      let text = Array.isArray(res.data) ? res.data[0]?.generated_text : res.data?.generated_text;
      if (!text) continue;

      text = text.replace(prompt, '').replace(/^(User:|Assistant:|Bot:)?/i, '').split('\n')[0].trim();
      if (text.length > 2 && text.length < 500) return text + ' 🤖';

    } catch (err) {
      const code = err.response?.status;
      if (code === 404) console.log(`❌ Modelo no encontrado: ${model.name}`);
    }
  }

  throw new Error('Todos los modelos de Hugging Face fallaron');
}

function getSmartLocalResponse(msg) {
  const low = msg.toLowerCase();
  if (low.includes('hola')) return '¡Hola! ¿En qué puedo ayudarte? 🤖';
  if (low.includes('adiós') || low.includes('chau')) return '¡Hasta luego! 👋';
  return 'No entendí eso, ¿podés repetirlo? 🤖';
}

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado');

  socket.on('join', ({ username }) => {
    socket.broadcast.emit('message', {
      _id: Date.now().toString(),
      username: 'Sistema',
      message: `🎉 ${username} entró al chat`,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('message', async (data) => {
    io.emit('message', data);

    if (data.username !== 'Bot') {
      let reply;
      try {
        reply = await getHuggingFaceResponse(data.message);
      } catch {
        reply = getSmartLocalResponse(data.message);
      }

      io.emit('message', {
        _id: (Date.now() + 1).toString(),
        username: 'Bot',
        message: reply,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('disconnect', () => console.log('🔌 Cliente desconectado'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
