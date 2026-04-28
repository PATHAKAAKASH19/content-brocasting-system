import supabase from "../config/supabase.js";

export const ScheduleModel = {
  async getOrCreateSubjectSlot(subject) {
    try {
      
      let { data, error } = await supabase
        .from("content_slots")
        .select("*")
        .eq("subject", subject)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        
        const { data: newSlot, error: createError } = await supabase
          .from("content_slots")
          .insert([
            {
              subject: subject,
              current_position: 0,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        return newSlot;
      }

      return data;
    } catch (error) {
      console.error("getOrCreateSubjectSlot error:", error);
      throw error;
    }
  },

  
  async addToSchedule(contentId, slotId, rotationOrder, duration) {
    try {
      const { data, error } = await supabase
        .from("content_schedule")
        .insert([
          {
            content_id: contentId,
            slot_id: slotId,
            rotation_order: rotationOrder,
            duration: duration || 5,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("addToSchedule error:", error);
      throw error;
    }
  },

 
  async getScheduleBySlot(slotId) {
    try {
      const { data, error } = await supabase
        .from("content_schedule")
        .select(
          `
          *,
          content:content_id (
            id,
            title,
            description,
            file_url,
            start_time,
            end_time,
            status
          )
        `,
        )
        .eq("slot_id", slotId)
        .order("rotation_order", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("getScheduleBySlot error:", error);
      return [];
    }
  },

  async findByContentId(contentId) {
    try {
      const { data, error } = await supabase
        .from("content_schedule")
        .select("*")
        .eq("content_id", contentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("findByContentId error:", error);
      return null;
    }
  },

 
  async getSubjectSchedule(subject) {
    try {
      const { data: slot, error: slotError } = await supabase
        .from("content_slots")
        .select("*")
        .eq("subject", subject)
        .maybeSingle();

      if (slotError) throw slotError;
      if (!slot) return null;

      const { data: schedule, error: scheduleError } = await supabase
        .from("content_schedule")
        .select(
          `
          *,
          content:content_id (
            id,
            title,
            description,
            file_url,
            file_type,
            start_time,
            end_time,
            rotation_duration,
            status
          )
        `,
        )
        .eq("slot_id", slot.id)
        .order("rotation_order", { ascending: true });

      if (scheduleError) throw scheduleError;

      return {
        slot,
        schedule: schedule || [],
      };
    } catch (error) {
      console.error("getSubjectSchedule error:", error);
      return null;
    }
  },

 
  async removeFromSchedule(contentId) {
    try {
    
      const scheduleEntry = await this.findByContentId(contentId);

      if (!scheduleEntry) {
        return { success: true, message: "Content not in schedule" };
      }

      const { error } = await supabase
        .from("content_schedule")
        .delete()
        .eq("content_id", contentId);

      if (error) throw error;

      
      await this.reorderSlotAfterRemoval(
        scheduleEntry.slot_id,
        scheduleEntry.rotation_order,
      );

      return { success: true, message: "Removed from schedule" };
    } catch (error) {
      console.error("removeFromSchedule error:", error);
      throw error;
    }
  },

  async reorderSlotAfterRemoval(slotId, removedOrder) {
    try {
     
      const { data, error } = await supabase
        .from("content_schedule")
        .select("*")
        .eq("slot_id", slotId)
        .gt("rotation_order", removedOrder)
        .order("rotation_order", { ascending: true });

      if (error) throw error;

    
      for (const item of data) {
        const { error: updateError } = await supabase
          .from("content_schedule")
          .update({ rotation_order: item.rotation_order - 1 })
          .eq("id", item.id);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error("reorderSlotAfterRemoval error:", error);
      return false;
    }
  },


  async updateSlotOrders(slotId) {
    try {
    
      const { data, error } = await supabase
        .from("content_schedule")
        .select("*")
        .eq("slot_id", slotId)
        .order("rotation_order", { ascending: true });

      if (error) throw error;

    
      for (let i = 0; i < data.length; i++) {
        const { error: updateError } = await supabase
          .from("content_schedule")
          .update({ rotation_order: i + 1 })
          .eq("id", data[i].id);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error("updateSlotOrders error:", error);
      return false;
    }
  },

  async getAllSubjectSchedules() {
    try {
      const { data: slots, error } = await supabase
        .from("content_slots")
        .select("*")
        .order("subject", { ascending: true });

      if (error) throw error;

      const schedules = [];
      for (const slot of slots) {
        const schedule = await this.getSubjectSchedule(slot.subject);
        if (schedule && schedule.schedule.length > 0) {
          schedules.push(schedule);
        }
      }

      return schedules;
    } catch (error) {
      console.error("getAllSubjectSchedules error:", error);
      return [];
    }
  },

 
  async getNextInRotation(slotId, currentOrder) {
    try {
      let nextOrder = currentOrder + 1;

      let { data, error } = await supabase
        .from("content_schedule")
        .select("*, content:content_id(*)")
        .eq("slot_id", slotId)
        .eq("rotation_order", nextOrder)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: first, error: firstError } = await supabase
          .from("content_schedule")
          .select("*, content:content_id(*)")
          .eq("slot_id", slotId)
          .eq("rotation_order", 1)
          .maybeSingle();

        if (firstError) throw firstError;
        return first;
      }

      return data;
    } catch (error) {
      console.error("getNextInRotation error:", error);
      return null;
    }
  },
};

export default ScheduleModel;
