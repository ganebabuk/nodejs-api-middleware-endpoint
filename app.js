
// npm run dev (nodemon) or npm run start
const env = require('dotenv').config();
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

app.get('/api/external-get', async(req, res) => {
  try {
    const response = await fetch('https://reqres.in/api/users?page=1');
    const data = await response.json();
    if (data) {
      res.status(200).json({ data: data });
    }
  } catch (e) {
    console.error("Couldn't get the data.", e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/external-post', async(req, res) => {
  try {
    const ires = await axios.post('https://reqres.in/api/users', {
      name: 'morpheus',
      job: 'leader',
    });
  
    console.log(`statusCode: ${ires.status}`);
    console.log('ires', ires.data);
  
    res.status(201).json({ data: ires.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/concurrent', async (req, res) => {
  try {
    const pageno = [1, 2];
    const requests = pageno.map((page) =>
      axios.get(`https://reqres.in/api/users?page=${page}`)
    );
    const result = await Promise.all(requests);
    const users = result.flatMap((res) => res.data.data); // Flatten and merge user data
    res.status(200).json({ users });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(503).json({ error: String(err) });
  }
});

// Create
app.get('/api/db/insert', async(req, res) => {
  try {
    const email = randomstring.generate(15);
    const users = new Users({
      email: `${email}@test.com`,
      first_name : 'ganesh babu',
      last_name: 'kuppusamy',
      age: 31,
      gender: 'M',
      marks: [
        {
          english: 50,
          maths: 60
        }
      ],
      date_created: new Date(),
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

// Read
app.get('/api/db/read', async(req, res) => {
  try {
    const dataAll = await Users.find();
    // you can also find()
    const dataFindByEmail = await Users.find({"email":  { $regex: /BesuEq6oFXRir3c@TEST.com/, $options: 'i' }}).select("first_name last_name");
    const dataLimit = await Users.find().limit(1);
    // email sorting in asc because it's string and age sorting in desc so only given -1
    const dataOrder = await Users.find().collation({locale: "en" }).sort({email: "asc", age: -1});
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
      // with showing the record which have min age
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
      // with showing the record which have max age
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
    // normal count
    const userCount = await Users.countDocuments({ first_name: 'ganesh babu' });
    // count with aggregate
    const userCount2 = await Users.aggregate([
      {
        $match: { age: {$gt: 30 }}
      },
      {
        $count: "count"
      }
    ]);
    // start with 'G'
    const usersWithPattern = await Users.find({ first_name: { $regex: /^G/, $options: 'i' } });
    // end with 'U'
    const usersWithPattern2 = await Users.find({ first_name: { $regex: /U$/, $options: 'i'  } });
    // containing 'NE'
    const usersWithPattern3 = await Users.find({ first_name: { $regex: /ne/, $options: 'i'  } });
    // join
    const joins = await Users.aggregate([
      {
        $lookup: {
          from: 'gender', // The collection name in the database
          localField: 'gender', // Field in UserProfile to match
          foreignField: 'key', // Field in Gender to match
          as: 'genderDetails' // Output array field
        }
      },
      {
        $unwind: '$genderDetails' // Unwind the array to get objects instead of arrays
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          age: 1,
          gender: '$genderDetails.value', // Include the `value` field from genderDetails
          marks: 1,
          date_created: 1
        }
      }
    ]);
    res.status(200).json({
      dataAll: dataAll,
      dataFindByEmail: dataFindByEmail,
      dataLimit: dataLimit,
      dataOrder: dataOrder,
      dataOrder2: dataOrder2,
      dataOrder2: dataOrder2,
      dataFindWithAgreegate: dataFindWithAgreegate,
      aggregatedData: aggregatedData,
      aggregatedData2: aggregatedData2,
      aggregatedData3: aggregatedData3,
      aggregatedData4: aggregatedData4,
      userCount: userCount,
      userCount2: userCount2,
      usersWithPattern: usersWithPattern,
      usersWithPattern2: usersWithPattern2,
      usersWithPattern3: usersWithPattern3,
      joins: joins
    });
  } catch(e) {
    console.error("Couldn't find the user(s)", e);
    res.status(500).json({
      message: "Couldn't find the user(s)",
      error: e
    });
  };
});

// Update
app.get('/api/db/update', async(req, res) => {
  try {
    const findQuery = {email: 'BesuEq6oFXRir3c@test.com' };
    const updateQuery = {first_name: 'ganesh babu', last_name: 'kuppusamy'};
    // push additional element
    // const updateQuery2 = { $push: { marks: { english: 60, maths: 70 } } };
    // update single element
    // const updateQuery2 = { $set: { 'marks.0.english': 60, 'marks.0.maths': 70 } };
    // all the indexes of marks
    const updateQuery2 = { $set: { marks: { english: 76, maths: 77 } } };
    await Users.findOneAndUpdate(findQuery, updateQuery);
    await Users.updateMany(findQuery, updateQuery2);
    res.status(200).json({
      status: 'Updated successfully.'
    });
  } catch(e) {
    console.error("Couldn't update the data(s)", e);
    res.status(500).json({
      message: "Couldn't update the data(s)",
      error: e
    });
  };
});

// Delete
app.get('/api/db/delete', async(req, res) => {
  try {
    const deleteQuery = { first_name: 'ganesh babu2' };
    await Users.deleteOne(deleteQuery);
    const deleteQuery2 = {};
    await Users.deleteMany(deleteQuery2);
    res.status(200).json({
      status: 'deleted successfully.'
    });
  } catch(e) {
    console.error("Couldn't delete the data(s)", e);
    res.status(500).json({
      message: "Couldn't delete the data(s)",
      error: e
    });
  };
});

app.listen(3030, () => {
  console.log(`app listening at 3030`);
});
// local dev url
