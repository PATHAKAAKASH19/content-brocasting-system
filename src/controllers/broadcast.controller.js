import supabase from "../config/supabase.js";
import schedulingService from "../services/scheduling.service.js";
import ScheduleModel from "../models/schedule.model.js";


export const getLiveContent = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query; 

   
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required",
      });
    }

  
    const now = new Date().toISOString();

    let query = supabase
      .from("content")
      .select(
        `
        id,
        title,
        description,
        subject,
        file_url,
        file_type,
        start_time,
        end_time,
        rotation_duration,
        users:uploaded_by (
          id,
          name,
          email
        )
      `,
      )
      .eq("uploaded_by", teacherId)
      .eq("status", "approved")
      .lte("start_time", now)
      .gte("end_time", now);

    if (subject) {
      query = query.ilike("subject", subject);
    }

    const { data: contents, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }


    if (!contents || contents.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: subject
          ? `No content available for subject: ${subject}`
          : "No content available",
        teacher_id: teacherId,
        subject_filter: subject || null,
        timestamp: new Date().toISOString(),
      });
    }

   
    const groupedBySubject = {};

    for (const content of contents) {
      if (!groupedBySubject[content.subject]) {
        groupedBySubject[content.subject] = [];
      }
      groupedBySubject[content.subject].push(content);
    }

    const result = [];

    for (const [subjectName, subjectContents] of Object.entries(
      groupedBySubject,
    )) {
      const enhancedContents = await Promise.all(
        subjectContents.map(async (content) => {
          const schedule = await ScheduleModel.findByContentId(content.id);
          return {
            ...content,
            rotation_order: schedule?.rotation_order || 0,
            duration: schedule?.duration || content.rotation_duration || 5,
          };
        }),
      );

    
      const sortedContents = enhancedContents.sort(
        (a, b) => a.rotation_order - b.rotation_order,
      );

    
      const totalCycleDuration = sortedContents.reduce(
        (sum, c) => sum + c.duration,
        0,
      );

     
      const activeContent =
        schedulingService.calculateActiveContent(sortedContents);

      if (activeContent) {
        result.push({
          subject: subjectName,
          current_content: {
            id: activeContent.content.id,
            title: activeContent.content.title,
            description: activeContent.content.description,
            file_url: activeContent.content.file_url,
            file_type: activeContent.content.file_type,
            duration_minutes: activeContent.content.duration,
          },
          schedule_info: {
            remaining_time_minutes:
              Math.round(activeContent.remaining_time * 10) / 10,
            remaining_time_formatted: schedulingService.formatTime(
              activeContent.remaining_time,
            ),
            total_cycle_duration: totalCycleDuration,
            total_content_count: sortedContents.length,
          },
          rotation_preview: sortedContents.map((c, idx) => ({
            order: idx + 1,
            title: c.title,
            duration: c.duration,
            is_active: c.id === activeContent.content.id,
          })),
        });
      }
    }

   
    if (subject && result.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: `No active content available for subject: ${subject}`,
        teacher_id: teacherId,
        subject_filter: subject,
        timestamp: new Date().toISOString(),
      });
    }

    
    res.status(200).json({
      success: true,
      data: result,
      message:
        result.length > 0
          ? `Found ${result.length} subject(s) with active content`
          : "No active content available",
      teacher_id: teacherId,
      subject_filter: subject || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get live content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const getLiveContentBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject parameter is required",
      });
    }

    const now = new Date().toISOString();


    const { data: contents, error } = await supabase
      .from("content")
      .select(
        `
        id,
        title,
        description,
        subject,
        file_url,
        file_type,
        start_time,
        end_time,
        rotation_duration,
        users:uploaded_by (
          id,
          name,
          email
        )
      `,
      )
      .eq("subject", subject)
      .eq("status", "approved")
      .lte("start_time", now)
      .gte("end_time", now)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    if (!contents || contents.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: `No content available for subject: ${subject}`,
        subject: subject,
        timestamp: new Date().toISOString(),
      });
    }

    const groupedByTeacher = {};
    for (const content of contents) {
      const teacherId = content.users.id;
      if (!groupedByTeacher[teacherId]) {
        groupedByTeacher[teacherId] = {
          teacher: {
            id: teacherId,
            name: content.users.name,
            email: content.users.email,
          },
          contents: [],
        };
      }
      groupedByTeacher[teacherId].contents.push(content);
    }

  
    const result = [];
    for (const [teacherId, teacherData] of Object.entries(groupedByTeacher)) {
      const activeContent = schedulingService.calculateActiveContent(
        teacherData.contents,
      );

      if (activeContent) {
        result.push({
          teacher: teacherData.teacher,
          current_content: activeContent.content,
          remaining_time_formatted: schedulingService.formatTime(
            activeContent.remaining_time,
          ),
        });
      }
    }

    res.status(200).json({
      success: true,
      data: result,
      message:
        result.length > 0
          ? `Found ${result.length} teacher(s) with active ${subject} content`
          : `No active ${subject} content available`,
      subject: subject,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get live content by subject error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getAllTeachers = async (req, res) => {
  try {
    const { data: teachers, error } = await supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("role", "teacher")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    const teachersWithContent = await Promise.all(
      (teachers || []).map(async (teacher) => {
        const now = new Date().toISOString();
        const { count, error: countError } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("uploaded_by", teacher.id)
          .eq("status", "approved")
          .lte("start_time", now)
          .gte("end_time", now);

        return {
          ...teacher,
          has_active_content: !countError && count > 0,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: teachersWithContent.length,
      data: teachersWithContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get all teachers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getTeacherSubjects = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const now = new Date().toISOString();

    const { data: subjects, error } = await supabase
      .from("content")
      .select("subject")
      .eq("uploaded_by", teacherId)
      .eq("status", "approved")
      .lte("start_time", now)
      .gte("end_time", now);

    if (error) throw error;

    const uniqueSubjects = [...new Set(subjects.map((s) => s.subject))];

    res.status(200).json({
      success: true,
      teacher_id: teacherId,
      count: uniqueSubjects.length,
      data: uniqueSubjects,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get teacher subjects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
