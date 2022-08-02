const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    avatar:{
        type:String,
        default:""
    },
    fname:{
        type:String,
        required:true
    },
    profession:{
        type:String,
        required:true
    },
    about:{
        type:String,
        default:""
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        unique:true
    },
    followers:[Schema.Types.ObjectId],

    following:[Schema.Types.ObjectId],

    verified:{
        type:Boolean,
        default:false
    }

},{
    timestamps: true
})

module.exports = mongoose.model("users",UserSchema)