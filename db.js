const mongoose = require('mongoose');

require('dotenv').config();

const connectToMongo = () =>{
    mongoose.connect(process.env.mongoURI1,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    .then(() => console.log("Connected to Mongo successfully"))
    .catch((error) => console.log(error.message))
}

module.exports = connectToMongo;