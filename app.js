
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
const http = require('http');
const url = require('url');
const cors = require('cors');
const session = require('express-session');
const redis = require('redis');
const authRoutes = require('./routes/auth');
// const connectRedis = require('connect-redis');
// const RedisStore = connectRedis(session);
// const redisClient = redis.createClient();
const app = express();
const allowedOrigins = ['http://localhost:3000'];
// Retrieve secret from environment variable or configuration
const sessionSecret = process.env.SESSION_SECRET || 'your-default-secret';
app.use('/api/auth', authRoutes);
app.use(session({
  // store: new RedisStore({ client: redisClient }), // this is optional if you want redis then you can use it
  secret: sessionSecret,       // Use the same secret for all sessions
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },   // Set to true if using HTTPS
}));
// express based routing
app.use((req, res, next) => {
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
// CORS configuration with multiple origins and headers
app.use(cors({
  origin: function (origin, callback) {
    // Check if the request's origin is in the list of allowed origins
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request if the origin is in the list
    } else {
      callback(new Error('Not allowed by CORS')); // Reject the request if the origin is not allowed
    }
  },
  methods: 'GET, POST, PATCH, PUT, DELETE, OPTIONS', // Allow multiple HTTP methods
  allowedHeaders: 'Origin,Content-Type,Authorization,X-Requested-With', // Allow multiple headers
  credentials: true, // Allow credentials (cookies, etc.) if needed
}));
// Limit request size for JSON payloads (e.g., 1 MB)
app.use(express.json({ limit: '1mb' }));
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Middleware for timeout handling
const timeoutMiddleware = (req, res, next) => {
  const _timer = Date.now();
  console.log('_timer:', _timer);

  // Store the timeout ID
  let timeoutId;

  // Function to check for timeout
  const checkTimeout = () => {
    if (Date.now() > _timer + 10000) { // 10 seconds timeout
      console.log('_now:', Date.now());
      return res.status(503).json({ error: 'Request timed out' });
    } else {
      timeoutId = setTimeout(checkTimeout, 1000); // Check every 1 second
    }
  };

  // Start the timeout check
  checkTimeout();

  // Clear timeout when the request is finished or aborted
  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));

  // Call the next middleware or route handler
  next();
};


// Apply middleware to all routes
app.use(timeoutMiddleware);

app.get('/api/infinity', (req, res) => {
  setTimeout(() => {
    if (!res.headersSent) {  // Always check if response has already been sent
      res.status(200).json({ fullname: 'ganesh babu kuppusamy', country: 'India' });
    }
  }, 20000);  // 20 seconds timeout, which exceeds the middleware's 10 seconds limit
});


app.get('/api/user', (req, res) => {
  res.status(200).json({ fullname: 'ganesh babu kuppusamy', country: 'India' });
});

app.get('/api/login', (req, res) => {
  req.session.username = 'ganesh babu kuppusamy'; // Store username in session
  res.status(200).json({ session_username: req.session.username });
});
// Route to log out and destroy the session
app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});
app.get('/page/home', (req, res) => {
  const homePath = path.join(__dirname, 'pages/index.html');
  res.sendFile(homePath);
});
app.get('/api/user', (req, res) => {
  res.status(200).json({ fullname: 'ganesh babu kuppusamy', country: 'India' });
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

app.get('/api/timeout', (req, res) => {
  const timeoutId = setTimeout(() => {
    res.status(503).json({ error: 'Request timed out' });
  }, 5000); // 5 seconds timeout

  // Simulate long-running task
  // clearTimeout(timeoutId) if the task completes successfully
});

app.listen(3030, () => {
  console.log(`app listening at 3030`);
});

// http based routing
let data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];

// Create the server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const urlpath = parsedUrl.pathname;
  const method = req.method;

  // Enable CORS for all requests by setting the necessary headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allow specific methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

  // Handle preflight OPTIONS request (for complex requests like POST, PUT)
  if (req.method === 'OPTIONS') {
    res.writeHead(204); // No content for preflight request
    res.end();
    return;
  }


  // Set the response headers
  res.setHeader('Content-Type', 'application/json');

  // GET all data
  if (urlpath === '/api/data' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ data }));
  }
  
  // GET a single item by id
  else if (urlpath.match(/\/api\/data\/\d+/) && method === 'GET') {
    const id = parseInt(path.split('/')[3]);
    const item = data.find(d => d.id === id);

    if (item) {
      res.writeHead(200);
      res.end(JSON.stringify(item));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Item not found' }));
    }
  }
  
  // POST: Add new item
  else if (urlpath === '/api/data' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const newItem = JSON.parse(body);
      newItem.id = data.length + 1;
      data.push(newItem);

      res.writeHead(201);
      res.end(JSON.stringify({ message: 'Item added', newItem }));
    });
  }
  
  // PUT: Update an existing item by id
  else if (urlpath.match(/\/api\/data\/\d+/) && method === 'PUT') {
    const id = parseInt(path.split('/')[3]);
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const updatedItem = JSON.parse(body);
      const itemIndex = data.findIndex(d => d.id === id);

      if (itemIndex !== -1) {
        data[itemIndex] = { ...data[itemIndex], ...updatedItem };
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Item updated', data: data[itemIndex] }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Item not found' }));
      }
    });
  }

  // DELETE: Delete an item by id
  else if (urlpath.match(/\/api\/data\/\d+/) && method === 'DELETE') {
    const id = parseInt(path.split('/')[3]);
    const itemIndex = data.findIndex(d => d.id === id);

    if (itemIndex !== -1) {
      data = data.filter(d => d.id !== id);
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Item deleted' }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Item not found' }));
    }
  }
  else if (urlpath === '/page/home' && method === 'GET') {
    // Serve another HTML file
    const aboutPath = path.join(__dirname, 'pages/index.html');
    fs.readFile(aboutPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Server Error</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } 

  // Handle 404 Not Found
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

