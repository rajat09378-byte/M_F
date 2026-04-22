const Groq = require('groq-sdk');
require('dotenv').config();
console.log('Key length:', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
groq.models.list().then(res => console.log('Models OK')).catch(e => console.error('Error:', e.message));
