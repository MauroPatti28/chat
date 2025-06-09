import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Clock } from 'lucide-react'; // Asegurate de tener esta dependencia o usa cualquier icono
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001'); // Cambia URL si tu servidor corre en otro lado

export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado al servidor');
    });

    socket.on('message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      socket.emit('join', { username });
      setShowUsernameModal(false);
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') action();
  };

  const sendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        _id: Date.now().toString(),
        username,
        message: inputMessage.trim(),
        timestamp: new Date().toISOString()
      };

      socket.emit('message', newMessage);
      setInputMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showUsernameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Bienvenido!</h2>
            <p className="text-gray-600">¿Cómo te llamás?</p>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleUsernameSubmit)}
            placeholder="Tu nombre..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none mb-4"
          />
          <button
            onClick={handleUsernameSubmit}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-semibold"
          >
            Entrar al chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white">
        
        {/* Header */}
        <header className="bg-indigo-600 text-white px-6 py-4">
          <h1 className="text-xl font-bold">Chat WebSocket</h1>
          <p className="text-sm">Conectado como: <span className="font-semibold">{username}</span></p>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow ${
                msg.username === username
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <div className="flex items-center text-xs mb-1 gap-2">
                  <span className="font-semibold">{msg.username === username ? 'Tú' : msg.username}</span>
                  <Clock size={12} className="opacity-60" />
                  <span className="opacity-60">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <footer className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, sendMessage)}
              placeholder="Escribí un mensaje..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

