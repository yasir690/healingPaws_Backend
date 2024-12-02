import multer from "multer";
import path from "path";

// export const Storage=multer.diskStorage({
//     destination:(req,file,callback)=>{
//         callback(null,path.join("public","uploads"))
//     },
//     filename:(req,file,callback)=>{
//       const fileName=file.originalname.split(" ").join("-");
//       const extension=path.extname(fileName);
//       const baseName=path.basename(fileName,extension);
//       callback(null,baseName + "-" + Date.now() +extension)
//     }
// })

export const handleMultiPartData = multer({
  storage: multer.memoryStorage(),
  // storage:Storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB in bytes
  },
  fileFilter: (req, file, callback) => {
    const FileTypes =
      /jpeg|jpg|png|gif|pdf|tif|tiff|doc|docm|docx|dotx|csv|aac|ogg|3gpp|3gpp2|wav|webm|mp4|mp3|mpeg|aiff|caf|flac|wav/;
    const mimType = FileTypes.test(file.mimetype);
    const extname = FileTypes.test(path.extname(file.originalname));
    if (mimType && extname) {
      return callback(null, true);
    }
    return callback(new Error("File type not supported"), false);
  },
});
