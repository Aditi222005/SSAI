import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const form = new FormData();
form.append('file', fs.createReadStream('active.pdf'));

fetch('https://studysync-backend-m7fx.onrender.com/upload-file', {
  method: 'POST',
  body: form
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
