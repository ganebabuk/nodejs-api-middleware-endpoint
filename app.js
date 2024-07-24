
// npm run dev (nodemon) or npm run start
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const randomstring = require('randomstring');
const dbConfig = require("./config/db-config");
const Users = require('./models/user');
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

app.get('/api/db/insert', async(req, res) => {
  try {
    const email = randomstring.generate(15);
    const users = new Users({
      _id: `${email}@test.com`,
      first_name : 'ganesh babu',
      last_name: 'kuppusamy',
      age: 41,
      date_created: new Date()
    });
    await users.save();
    res.status(201).json({
        message: "Successfully created!",
    });
  } catch(e) {
    console.error("Couldn't create the account", e);
    res.status(500).json({
      message: "Couldn't create the account",
      error: e
    });
  };
});

app.get('/api/db/read', async(req, res) => {
  try {
    const dataAll = await Users.find().limit();
    // you can also find()
    const dataFindByEmail = await Users.findOne({"_id": "jrsCM3V8YMMgw5z@test.com"});
    const dataLimit = await Users.find().limit(1);
    // _id i.e. email sorting in asc because it's string and age sorting in desc so only given -1
    const dataOrder = await Users.find().collation({locale: "en" }).sort({_id: "asc", age: -1});
    // sorting recently created record
    const dataOrder2 = await Users.find().collation({locale: "en" }).sort({date_created: -1});
    const dataFindWithAgreegate = await Users.find({age: { $gte: 21, $lte: 32 }});
    const aggregatedData = await Users.aggregate([
      {
        $group: {
          _id: null,
          minAge: { $min: "$age" },
          user: { $first: "$$ROOT" }
        }
      },
      // with showing the record which has min age
      {
        $project: {
          _id: 0,
          minAge: 1,
          user: 1
        }
      }
    ]);
    const aggregatedData2 = await Users.aggregate([
      {
        $group: {
          _id: null,
          maxAge: { $max: "$age" },
          user: { $first: "$$ROOT" }
        }
      },
      // with showing the record which has max age
      {
        $project: {
          _id: 0,
          maxAge: 1,
          user: 1
        }
      }
    ]);
    const aggregatedData3 = await Users.aggregate([
      {
        $group: {
          _id: null,
          sumAge: { $sum: "$age" }
        }
      }
    ]);
    const aggregatedData4 = await Users.aggregate([
      {
        $group: {
          _id: null,
          avgAge: { $avg: "$age" }
        }
      }
    ]);
    res.status(200).json({
        data1: dataAll,
        data2: dataFindByEmail,
        data3: dataLimit,
        data4: dataOrder,
        data5: dataOrder2,
        data6: dataOrder2,
        data7: dataFindWithAgreegate,
        data8: aggregatedData,
        data9: aggregatedData2,
        data10: aggregatedData3,
        data11: aggregatedData4
    });
  } catch(e) {
    console.error("Couldn't find the user(s)", e);
    res.status(500).json({
      message: "Couldn't find the user(s)",
      error: e
    });
  };
});

app.listen(3030, () => {
  console.log(`app listening at 3030`);
});
// local dev url
