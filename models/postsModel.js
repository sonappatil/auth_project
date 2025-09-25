
const mongoose = require('mongoose');const { applyTimestamps } = require('./usersModel');
;

const postSchema = mongoose.Schema({
    title:{
        type : String,
        required :[true, "title is  required!"],
        trim: true,
    },
    description:{
        type: String,
        required: [true, 'title description is required!'],
        trim: true,
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
},
{
    timestamps : true
});

module.exports = mongoose.model('Post', postSchema);