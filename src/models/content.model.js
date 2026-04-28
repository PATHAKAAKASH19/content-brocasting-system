import supabase from "../config/supabase.js";

export const ContentModel = {

  async create(contentData) {
    const { data, error } = await supabase
      .from("content")
      .insert([
        {
          title: contentData.title,
          description: contentData.description || "",
          subject: contentData.subject,
          file_url: contentData.file_url,
          file_type: contentData.file_type,
          file_size: contentData.file_size,
          uploaded_by: contentData.uploaded_by,
          start_time: contentData.start_time,
          end_time: contentData.end_time,
          rotation_duration: contentData.rotation_duration || 5,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async findByTeacher(teacherId) {
    const { data, error } = await supabase
      .from("content")
      .select(
        `
        *,
        users:uploaded_by (name, email)
      `,
      )
      .eq("uploaded_by", teacherId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findAll(filters = {}) {
    let query = supabase.from("content").select(`
        *,
        users:uploaded_by (id, name, email)
      `);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.subject) {
      query = query.eq("subject", filters.subject);
    }
    if (filters.teacherId) {
      query = query.eq("uploaded_by", filters.teacherId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("findAll error:", error);
      return [];
    }
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from("content")
      .select(
        `
        *,
        users:uploaded_by (id, name, email)
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },


  async updateStatus(id, status, rejectionReason = null, approvedBy = null) {
    const updateData = { status };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = approvedBy;
      updateData.rejection_reason = null;
    }

    if (status === "rejected" && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from("content")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },


  async delete(id) {
    const { error } = await supabase.from("content").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  async getApprovedActiveContent(teacherId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("uploaded_by", teacherId)
      .eq("status", "approved")
      .lte("start_time", now)
      .gte("end_time", now)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },


  async getContentWithSchedule(subject) {
    const now = new Date().toISOString();


    const { data: contents, error } = await supabase
      .from("content")
      .select("*")
      .eq("status", "approved")
      .eq("subject", subject)
      .lte("start_time", now)
      .gte("end_time", now);

    if (error) throw error;
    if (!contents || contents.length === 0) return [];

 
    const contentsWithSchedule = await Promise.all(
      contents.map(async (content) => {
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

    return contentsWithSchedule.sort(
      (a, b) => a.rotation_order - b.rotation_order,
    );
  },
};

export default ContentModel;
