import fetch from 'node-fetch';

const testMessage = "What is the syllabus for active?";

fetch('http://localhost:3001/chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: testMessage }),
})
.then(response => response.json())
.then(data => console.log('Chatbot response:', data))
.catch(error => console.error('Error:', error));
