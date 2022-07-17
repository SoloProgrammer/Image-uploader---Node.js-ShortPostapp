const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    author_id:{
        type:Schema.Types.ObjectId,
        ref:"users",
        require:true
    },
    author:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    likeArr:[Schema.Types.ObjectId],

    dislikeArr:[Schema.Types.ObjectId],
    
    comments:[Object]
},{
    timestamps:true
})

module.exports = mongoose.model('posts',PostSchema);