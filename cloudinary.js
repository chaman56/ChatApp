const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({ 
  cloud_name: 'djrzg20q4', 
  api_key: '894362325429518', 
  api_secret: 'uJWNP0vR8sa1m9sffvP3u6BX6ww' 
});

const storage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder: "images",
    allowedFormats: ['jpg', 'png', 'gif', 'jpeg']
  }
});

module.exports = {
  cloudinary,
  storage
} 