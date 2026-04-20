const AWS = require('aws-sdk');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (file, keyPrefix) => {
  const ext = path.extname(file.originalname) || '.jpg';
  const key = `${keyPrefix}_${Date.now()}${ext}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = { uploadToS3 };
