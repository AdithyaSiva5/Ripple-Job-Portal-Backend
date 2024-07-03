import express from "express";
import {
addJob, addJobApplication, cancelJobApplication, editJob, employeeApplications, employerApplications, getAllJobDetails, jobDetails, listActiveJobs,
listUserJobs,
updateApplicationStatus
} from "../controllers/jobController";
import { Request, Response, NextFunction } from 'express';

import multer, { Multer } from 'multer'; 
import path from 'path';
import fs from 'fs';
import { protect } from "../middlewares/auth";


const router = express.Router();

 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/uploads'); 
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

  
const upload = multer({ storage });

upload.any();


router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(req);
  
  if (err instanceof multer.MulterError) {
  
    console.error('Multer error:', err);
    res.status(400).json({ error: 'File upload failed', message: err.message });
  } else {
    
    console.error('Other error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/add-job',protect,addJob);
router.post('/edit-job',protect,editJob);
router.post('/list-all-job',protect,listActiveJobs);
router.post('/list-user-job',protect,listUserJobs)
router.post('/job-details',protect,jobDetails)
router.post('/apply-job',upload.single('resume'),addJobApplication)
router.post('/update-application-status',protect,updateApplicationStatus)
router.post('/get-applications-employee',protect,employeeApplications)
router.post('/get-applications-empolyer',protect,employerApplications)
router.post('/get-all-job-details',protect,getAllJobDetails)
router.post('/cancel-job-application',protect,cancelJobApplication)
export default router;