import ContentModel from "../models/content.model.js";
import storageService from "../services/storage.service.js";
import ScheduleModel from "../models/schedule.model.js";
import fs from "fs";



export const uploadContent = async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? 'present' : 'missing',
      body: req.body
    });
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file (JPG, PNG, or GIF)'
      });
    }

    const {
      title,
      subject,
      description,
      start_time,
      end_time,
      rotation_duration
    } = req.body;

  
    if (!title || !subject || !start_time || !end_time) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subject, start_time, end_time'
      });
    }

    
    const uploadResult = await storageService.uploadFile(
      req.file.path,
      req.file.originalname,
      req.file.mimetype
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to storage'
      });
    }

    const contentData = {
      title,
      description: description || '',
      subject,
      file_url: uploadResult.fileUrl,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user.id,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      rotation_duration: parseInt(rotation_duration) || 5
    };

    const content = await ContentModel.create(contentData);

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully',
      data: content
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getTeacherContent = async (req, res) => {
  try {
    const content = await ContentModel.findByTeacher(req.user.id);

    res.status(200).json({
      success: true,
      count: content.length,
      data: content,
    });
  } catch (error) {
    console.error("Get teacher content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllContent = async (req, res) => {
  try {
    const { status, subject, teacherId } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (subject) filters.subject = subject;
    if (teacherId) filters.teacherId = teacherId;

    const content = await ContentModel.findAll(filters);

    res.status(200).json({
      success: true,
      count: content.length,
      filters: filters,
      data: content,
    });
  } catch (error) {
    console.error("Get all content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await ContentModel.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    
    if (req.user.role === "teacher" && content.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own content.",
      });
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("Get content by id error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await ContentModel.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    if (content.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own content.",
      });
    }

    
    if (content.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete approved content. Please contact principal.",
      });
    }

    
    if (content.file_url) {
      const filePath = content.file_url.split("/").pop();
      await storageService.deleteFile(`content/${filePath}`);
    }

    await ContentModel.delete(id);

    res.status(200).json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};



export const approveContent = async (req, res) => {
  try {
    const { id } = req.params;
    
   
    const content = await ContentModel.findById(id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    if (content.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Content is already approved'
      });
    }
    
    if (content.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve rejected content. Teacher needs to re-upload.'
      });
    }
    
    
    const now = new Date();
    const startTime = new Date(content.start_time);
    const endTime = new Date(content.end_time);
    
    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve expired content. Content end time has passed.'
      });
    }
    
    
    const updatedContent = await ContentModel.updateStatus(
      id,
      'approved',
      null,
      req.user.id
    );
    
  
    await addToSubjectSchedule(updatedContent);
    
    res.status(200).json({
      success: true,
      message: 'Content approved successfully and added to broadcast schedule',
      data: {
        id: updatedContent.id,
        title: updatedContent.title,
        subject: updatedContent.subject,
        status: updatedContent.status,
        approved_at: updatedContent.approved_at,
        approved_by: req.user.name
      }
    });
    
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


export const rejectContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    
   
    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
  
    const content = await ContentModel.findById(id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    if (content.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject already approved content. Please contact support.'
      });
    }
    
    if (content.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Content is already rejected'
      });
    }
   
    const updatedContent = await ContentModel.updateStatus(
      id,
      'rejected',
      rejection_reason,
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Content rejected',
      data: {
        id: updatedContent.id,
        title: updatedContent.title,
        subject: updatedContent.subject,
        status: updatedContent.status,
        rejection_reason: updatedContent.rejection_reason,
        rejected_at: updatedContent.updated_at
      }
    });
    
  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

async function addToSubjectSchedule(content) {
  try {
 
    const slot = await ScheduleModel.getOrCreateSubjectSlot(content.subject);
    
  
    const existingSchedule = await ScheduleModel.findByContentId(content.id);
    if (existingSchedule) {
      console.log('Content already in schedule, skipping...');
      return;
    }
    
   
    const scheduleItems = await ScheduleModel.getScheduleBySlot(slot.id);
    const nextRotationOrder = scheduleItems.length + 1;
    
    
    const scheduleEntry = await ScheduleModel.addToSchedule(
      content.id,
      slot.id,
      nextRotationOrder,
      content.rotation_duration || 5
    );
    
    console.log(`Content added to ${content.subject} schedule at position ${nextRotationOrder}`);
    
    return scheduleEntry;
    
  } catch (error) {
    console.error('Error adding to schedule:', error);
    throw error;
  }
}


export const getPendingContent = async (req, res) => {
  try {
    const content = await ContentModel.findAll({ status: 'pending' });
    
    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
    
  } catch (error) {
    console.error('Get pending content error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


export const getContentStats = async (req, res) => {
  try {
    const allContent = await ContentModel.findAll();
    const pendingContent = allContent.filter(c => c.status === 'pending');
    const approvedContent = allContent.filter(c => c.status === 'approved');
    const rejectedContent = allContent.filter(c => c.status === 'rejected');
    
  
    const subjects = {};
    approvedContent.forEach(content => {
      if (!subjects[content.subject]) {
        subjects[content.subject] = 0;
      }
      subjects[content.subject]++;
    });
    
    res.status(200).json({
      success: true,
      data: {
        total: allContent.length,
        pending: pendingContent.length,
        approved: approvedContent.length,
        rejected: rejectedContent.length,
        by_subject: subjects,
        recent_uploads: allContent.slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
