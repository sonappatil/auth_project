const {createHmac} = require('crypto');
const bcrypt = require('bcryptjs');
const {hash, compare} = bcrypt;

exports.doHash = (value, saltValue) =>{
    const result = hash(value, saltValue);
    return result;
};

exports.dohashValidation = (value, hashedValue) =>{
    const result = bcrypt.compare(value, hashedValue);
    return result;
}

exports.hmacProcess = (value, key) =>{
    const result = createHmac('sha256', key).update(value).digest('hex');
    return result;  
}