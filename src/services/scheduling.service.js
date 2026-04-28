
import supabase from "../config/supabase.js";
import ScheduleModel from "../models/schedule.model.js";
import ContentModel from "../models/content.model.js";

class SchedulingService {
  async getOrCreateSubjectSlot(subject) {
    return await ScheduleModel.getOrCreateSubjectSlot(subject);
  }

  async getContentForSubject(subject) {
    return await ContentModel.getContentWithSchedule(subject);
  }

  async getActiveContent(subject) {
    try {
      const contents = await this.getContentForSubject(subject);

      if (!contents || contents.length === 0) {
        return {
          success: false,
          hasContent: false,
          message: `No active content available for ${subject}`,
          data: null,
        };
      }

      const totalCycleDuration = contents.reduce((sum, content) => {
        return sum + (content.duration || 5);
      }, 0);

      const currentTimeMinutes = Math.floor(Date.now() / 1000 / 60);
      const cyclePosition = currentTimeMinutes % totalCycleDuration;

      let accumulatedTime = 0;
      let activeContent = null;
      let remainingTime = 0;

      for (const content of contents) {
        const contentDuration = content.duration || 5;

        if (
          cyclePosition >= accumulatedTime &&
          cyclePosition < accumulatedTime + contentDuration
        ) {
          activeContent = content;
          remainingTime = accumulatedTime + contentDuration - cyclePosition;
          break;
        }

        accumulatedTime += contentDuration;
      }

      if (!activeContent) {
        return {
          success: false,
          hasContent: false,
          message: `Unable to determine active content for ${subject}`,
          data: null,
        };
      }

      return {
        success: true,
        hasContent: true,
        data: {
          active: {
            id: activeContent.id,
            title: activeContent.title,
            description: activeContent.description,
            subject: activeContent.subject,
            file_url: activeContent.file_url,
            file_type: activeContent.file_type,
            duration: activeContent.duration || 5,
          },
          schedule_info: {
            total_contents: contents.length,
            total_cycle_duration: totalCycleDuration,
            cycle_position: Math.floor(cyclePosition),
            remaining_time_minutes: Math.round(remainingTime * 10) / 10,
          },
        },
      };
    } catch (error) {
      console.error("getActiveContent error:", error);
      return {
        success: false,
        hasContent: false,
        message: error.message,
        data: null,
      };
    }
  }

  calculateActiveContent(contents) {
    if (!contents || contents.length === 0) return null;

    const totalCycleDuration = contents.reduce(
      (sum, c) => sum + (c.duration || 5),
      0,
    );
    const currentTimeMinutes = Math.floor(Date.now() / 1000 / 60);
    const cyclePosition = currentTimeMinutes % totalCycleDuration;

    let accumulatedTime = 0;
    for (const content of contents) {
      const duration = content.duration || 5;
      if (
        cyclePosition >= accumulatedTime &&
        cyclePosition < accumulatedTime + duration
      ) {
        return {
          content: content,
          remaining_time: accumulatedTime + duration - cyclePosition,
        };
      }
      accumulatedTime += duration;
    }
    return null;
  }

  formatTime(minutes) {
    if (minutes < 1) {
      const seconds = Math.floor(minutes * 60);
      return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    }
    if (minutes < 60) {
      return `${Math.floor(minutes)} minute${Math.floor(minutes) !== 1 ? "s" : ""}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours !== 1 ? "s" : ""} ${Math.floor(mins)} minute${Math.floor(mins) !== 1 ? "s" : ""}`;
  }

  async getSchedulePreview(subject, previewMinutes = 60) {
    const contents = await this.getContentForSubject(subject);

    if (!contents || contents.length === 0) {
      return {
        success: false,
        hasContent: false,
        message: `No active content available for ${subject}`,
      };
    }

    const current = await this.getActiveContent(subject);

    return {
      success: true,
      hasContent: true,
      data: {
        subject: subject,
        current_content: current.data?.active,
        total_contents: contents.length,
        total_cycle_duration: contents.reduce(
          (sum, c) => sum + (c.duration || 5),
          0,
        ),
      },
    };
  }

  async getAllActiveContent() {
    try {
     
      const now = new Date().toISOString();

      const { data: contents, error } = await supabase
        .from("content")
        .select("subject")
        .eq("status", "approved")
        .lte("start_time", now)
        .gte("end_time", now);

      if (error) throw error;

      if (!contents || contents.length === 0) {
        return {
          success: true,
          data: {},
          message: "No active content available",
        };
      }

      
      const uniqueSubjects = [...new Set(contents.map((c) => c.subject))];

      
      const result = {};

      for (const subject of uniqueSubjects) {
        const activeContent = await this.getActiveContent(subject);
        if (activeContent.success && activeContent.hasContent) {
          result[subject] = {
            active: activeContent.data.active,
            schedule_info: activeContent.data.schedule_info,
          };
        }
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("getAllActiveContent error:", error);
      return {
        success: false,
        data: {},
        message: error.message,
      };
    }
  }

  async getRotationStatus() {
    const { data: slots } = await supabase
      .from("content_slots")
      .select("subject")
      .order("subject");

    const status = {};
    for (const slot of slots || []) {
      const active = await this.getActiveContent(slot.subject);
      status[slot.subject] = {
        is_active: active.hasContent,
        total_content: active.hasContent
          ? active.data.schedule_info.total_contents
          : 0,
      };
    }

    return { success: true, data: status };
  }

  async getBroadcastContent(teacherId, subjectFilter = null) {
    const now = new Date().toISOString();

    let query = supabase
      .from("content")
      .select("*")
      .eq("uploaded_by", teacherId)
      .eq("status", "approved")
      .lte("start_time", now)
      .gte("end_time", now);

    if (subjectFilter) {
      query = query.eq("subject", subjectFilter);
    }

    const { data: contents, error } = await query;

    if (error || !contents || contents.length === 0) {
      return {
        success: true,
        hasContent: false,
        message: "No content available",
        data: null,
      };
    }

    const groupedBySubject = {};
    for (const content of contents) {
      if (!groupedBySubject[content.subject]) {
        groupedBySubject[content.subject] = [];
      }
      groupedBySubject[content.subject].push(content);
    }

    const result = {};
    for (const [subject, subjectContents] of Object.entries(groupedBySubject)) {
      const contentsWithSchedule = await Promise.all(
        subjectContents.map(async (content) => {
          const { data: schedule } = await supabase
            .from("content_schedule")
            .select("rotation_order, duration")
            .eq("content_id", content.id)
            .maybeSingle();
          return {
            ...content,
            rotation_order: schedule?.rotation_order || 0,
            duration: schedule?.duration || content.rotation_duration || 5,
          };
        }),
      );

      const sortedContents = contentsWithSchedule.sort(
        (a, b) => a.rotation_order - b.rotation_order,
      );
      const active = this.calculateActiveContent(sortedContents);

      if (active) {
        result[subject] = active;
      }
    }

    return {
      success: true,
      hasContent: Object.keys(result).length > 0,
      data: result,
    };
  }
}

export default new SchedulingService();
