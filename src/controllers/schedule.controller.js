import schedulingService from "../services/scheduling.service.js";
import ScheduleModel from "../models/schedule.model.js";


export const getActiveContent = async (req, res) => {
  try {
    const { subject } = req.params;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject parameter is required",
      });
    }

    const result = await schedulingService.getActiveContent(subject);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Get active content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getSchedulePreview = async (req, res) => {
  try {
    const { subject } = req.params;
    const previewMinutes = parseInt(req.query.minutes) || 60;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject parameter is required",
      });
    }

    
    const limitedMinutes = Math.min(previewMinutes, 1440); // Max 24 hours

    const result = await schedulingService.getSchedulePreview(
      subject,
      limitedMinutes,
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Get schedule preview error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getAllActiveContent = async (req, res) => {
  try {
    const result = await schedulingService.getAllActiveContent();
    res.status(200).json(result);
  } catch (error) {
    console.error("Get all active content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getRotationStatus = async (req, res) => {
  try {
  
    if (req.user.role !== "principal") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Principal only.",
      });
    }

    const result = await schedulingService.getRotationStatus();
    res.status(200).json(result);
  } catch (error) {
    console.error("Get rotation status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getFullSubjectSchedule = async (req, res) => {
  try {
    const { subject } = req.params;

    const schedule = await ScheduleModel.getSubjectSchedule(subject);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: `No schedule found for subject: ${subject}`,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        subject: subject,
        slot_id: schedule.slot.id,
        total_content: schedule.schedule.length,
        rotation_order: schedule.schedule.map((item) => ({
          position: item.rotation_order,
          content_id: item.content.id,
          title: item.content.title,
          duration: item.duration,
          file_url: item.content.file_url,
        })),
      },
    });
  } catch (error) {
    console.error("Get full subject schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
