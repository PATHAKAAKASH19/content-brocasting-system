import supabase from "../config/supabase.js";

export const UserModel = {
  
  async create(userData) {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name: userData.name,
            email: userData.email.toLowerCase(),
            password_hash: userData.password_hash,
            role: userData.role,
            is_active: true,
          },
        ])
        .select("id, name, email, role, created_at")
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("create error:", err);
      throw err;
    }
  },


  async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("findByEmail error:", err);
      return null;
    }
  },

  
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, is_active, created_at, last_login_at")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("findById error:", err);
      return null;
    }
  },

  async updateLastLogin(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, name, email, role")
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("updateLastLogin error:", err);
      return null;
    }
  },

  
  async findAll(filters = {}) {
    try {
      let query = supabase
        .from("users")
        .select("id, name, email, role, is_active, created_at, last_login_at");

      if (filters.role) {
        query = query.eq("role", filters.role);
      }
      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("findAll error:", err);
      return [];
    }
  },

  
  async getAllTeachers() {
    return this.findAll({ role: "teacher" });
  },


  async getStats() {
    try {
      const { count: totalUsers, error: error1 } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: totalTeachers, error: error2 } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher");

      const { count: activeTeachers, error: error3 } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher")
        .eq("is_active", true);

      if (error1 || error2 || error3) throw error1 || error2 || error3;

      return {
        totalUsers: totalUsers || 0,
        totalTeachers: totalTeachers || 0,
        activeTeachers: activeTeachers || 0,
      };
    } catch (err) {
      console.error("getStats error:", err);
      return { totalUsers: 0, totalTeachers: 0, activeTeachers: 0 };
    }
  },

 
  async update(id, updateData) {
    try {
      const allowedUpdates = ["name", "is_active"];
      const filteredData = {};

      for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
          filteredData[key] = updateData[key];
        }
      }

      const { data, error } = await supabase
        .from("users")
        .update(filteredData)
        .eq("id", id)
        .select("id, name, email, role, is_active")
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("update error:", err);
      throw err;
    }
  },


  async emailExists(email) {
    try {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("email", email.toLowerCase());

      if (error) throw error;
      return count > 0;
    } catch (err) {
      console.error("emailExists error:", err);
      return false;
    }
  },
};

export default UserModel;
