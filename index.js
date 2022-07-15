const express = require('express');

const app = express();

const connectToMongo = require('./db');

const bodyparser = require('body-parser');

connectToMongo();

app.use(express.json());

// app.use(bodyparser.urlencoded({ extended: false }))

const port = process.env.PORT || 8000

app.get('/',(req,res)=>{
    res.json({"app":"ready"})
})

app.use('/api/',require('./Routes/user_route/User_controller'));
app.use('/api/',require('./Routes/Posts_route/Posts_Controller'));

app.listen(port,()=>{
    console.log(`shotpost app listening on port ${port}`)
})