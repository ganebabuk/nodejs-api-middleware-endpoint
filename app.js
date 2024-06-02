
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

app.post('/api/file-upload', (req, res, next) => {
  // client side sending the data through FormData
  const form = new formidable.IncomingForm();
  const renamedFile = randomstring.generate(15);
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send(err);
      next(err);
    }
    console.log('inputFields:::', fields);
    console.log('inPutFiles:::', files?.fileUploaded?.path);
    let oldPath = files?.fileUploaded?.path;
    let newPath = `${path.join(__dirname, 'uploads')}/${renamedFile}${path.extname(files?.fileUploaded?.name)}`;
    let rawData = fs.readFileSync(oldPath)
    fs.writeFile(newPath, rawData, (err) => {
      if (err) { 
        console.log(err)
        res.status(500).send(err);
      } else {
        res.status(201).json({ success: 'file uploaded successfully.' });
      }
    });
  })
  // .on('fileBegin', (name, file) => {
  //   file.path = `${__dirname}/uploads/${renamedFile}${path.extname(file?.name)}`;
  // })
  // .on('file', (name, file) => {
  //   fs.rename(file.path, `${__dirname}/uploads/${renamedFile}${path.extname(file?.name)}`, () => {
  //     console.log('file renamed');
  //   });
  // })
  // .on('field', (name, field) => {
  //   console.log('Name: ', name);
  //   console.log('Value: ', field);
  // })
  // .on('end', () => {
  //   res.status(201).json({ success: 'file uploaded successfully.' });
  // });
});

app.post('/api/test-post/:name', (req, res) => {
  console.log('body: ', req.body.fullname);
  console.log('params: ', req.params.name);
  console.log('query: ', req.query.id);
  res.status(201).json({ success: 'Data saved successfully.' });
});

app.get('/api/external-get', (req, res) => {
    fetch('https://reqres.in/api/users?page=1')
      .then(resData => resData.json())
      .then((resData2) => {
        res.status(200).json({ data222: resData2.data });
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
      response['users'] = [...response['users'], results.data];
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
