const path = require("path");
const multer = require("multer");

const maxSize = 10 * 1024 * 1024;

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  const error = new Error("Only JPG, JPEG, and PNG files are allowed");
  error.statusCode = 400;
  cb(error);
};

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

const createUploader = (folder) =>
  multer({
    storage: createStorage(folder),
    fileFilter: imageFileFilter,
    limits: { fileSize: maxSize },
  });

module.exports = { createUploader };
