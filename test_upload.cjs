const http = require('http');
const fs = require('fs');
fs.writeFileSync('test_image.png', 'fake image data');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const crlf = '\r\n';
let body = Buffer.concat([
  Buffer.from('--' + boundary + crlf),
  Buffer.from('Content-Disposition: form-data; name="title"' + crlf + crlf + 'Test Book' + crlf),
  Buffer.from('--' + boundary + crlf),
  Buffer.from('Content-Disposition: form-data; name="author"' + crlf + crlf + 'Test Author' + crlf),
  Buffer.from('--' + boundary + crlf),
  Buffer.from('Content-Disposition: form-data; name="isbn"' + crlf + crlf + '1234567891' + crlf),
  Buffer.from('--' + boundary + crlf),
  Buffer.from('Content-Disposition: form-data; name="category"' + crlf + crlf + 'Test Category' + crlf),
  Buffer.from('--' + boundary + crlf),
  Buffer.from('Content-Disposition: form-data; name="availableCopies"' + crlf + crlf + '1' + crlf),
  Buffer.from('--' + boundary + crlf),
  Buffer.from('Content-Disposition: form-data; name="coverImage"; filename="test_image.png"' + crlf),
  Buffer.from('Content-Type: image/png' + crlf + crlf),
  fs.readFileSync('test_image.png'),
  Buffer.from(crlf + '--' + boundary + '--' + crlf)
]);

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/books',
  method: 'POST',
  headers: { 
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc5NDQ3MjQ1LCJleHAiOjE3Nzk1MzM2NDV9.Po_w5cRqNGU-h_O2XN6ks7171O0SZxLtUmFZ6ncsrcg'
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Response:', data));
});
req.write(body);
req.end();
