
// npm run dev (nodemon) or npm run start
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const randomstring = require('randomstring');
const app = express();

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000'];
  if (allowedOrigins.indexOf(req.headers.origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  next();
});
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get('/api/user', (req, res) => {
  res.status(200).json({ fullname: 'ganesh babu kuppusamy', country: 'India' });
});

app.get('/api/infinity', (req, res) => {
  const x = true;
  const _timer = Date.now();
  console.log('_timer:', _timer);
  while (x) {
    // console.log("In loop");
    if (Date.now() > _timer + 30000) {
      console.log('_now:', Date.now());
      res.status(503).json({ error: 'time out error' });
      break;
    }
  }
});

app.post('/api/fileupload', (req, res) => {
  const form = formidable({ multiples: true });
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(503).json({ Error: 'Server Error.' });
      next(err);
      return;
    }
    // console.log({ fields, files });
    const readStream = fs.createReadStream(files.uploadedfile.path);
    const ext = path.extname(files.uploadedfile.name);
    var writeStream = fs.createWriteStream(
      './uploads/' + randomstring.generate(15) + ext
    );
    readStream.pipe(writeStream);
    readStream.on('end', () => {
      fs.unlinkSync(files.uploadedfile.path);
      console.log('end');
    });
    readStream.on('close', () => {
      console.log('close');
      res.status(201).json({ success: 'File uploded successfiuly.' });
    });
    readStream.on('error', (err) => {
      console.log('Error', err);
      res.status(503).json({ Error: 'Server Error.' });
    });
  });
});

app.post('/api/test-post/:name', (req, res) => {
  console.log('body: ', req.body.fullname);
  console.log('params: ', req.params.name);
  console.log('query: ', req.query.id);
  res.status(201).json({ success: 'Data saved successfiuly.' });
});

app.get('/api/external-get', (req, res) => {
  axios
    .get('https://reqres.in/api/users?page=1')
    .then((ires) => {
      console.log(`statusCode: ${ires.status}`);
      console.log('ires', ires.data);
      res.status(200).json({ data: ires.data });
    })
    .catch((error) => {
      console.error(error);
    });
});

app.get('/api/external-post', (req, res) => {
  axios
    .post('https://reqres.in/api/users', {
      name: 'morpheus',
      job: 'leader',
    })
    .then((ires) => {
      console.log(`statusCode: ${ires.status}`);
      console.log('ires', ires.data);
      res.status(201).json({ data: ires.data });
    })
    .catch((error) => {
      console.error(error);
    });
});

app.get('/api/concurrent', async (req, res) => {
  const pageno = [1, 2];
  const requests = pageno.map((date) =>
    axios.get(`https://reqres.in/api/users?page=${pageno}`)
  );
  console.log('requests:', requests);
  try {
    const result = await Promise.all(requests);
    const response = { users: [] };
    result.map((results) => {
      response['users'].push(results.data);
    });
    res.status(200).json(response);
  } catch (err) {
    res.status(503).json({ error: String(err) });
  }
});

app.listen(3030, () => {
  console.log(`app listening at 3030`);
});
// local dev url
