const mongoose = require("mongoose");
const dbConfiguration = async() => {
  // for development, please create .env file under the root and add MONGODB_URI=CONNECTION_STRING
  const MONGODB_URI = process?.env?.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside the .env file");
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to the atlas cloud."); 
  } catch(error) {
    console.error("Could not connect to the atlas cloud. ", error);
  }
}
dbConfiguration();