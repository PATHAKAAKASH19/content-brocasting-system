import supabase from "../config/supabase.js";

export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        return {
          connected: true,
          tablesExist: false,
          message: "Connected to Supabase but tables not created yet",
        };
      }
      throw error;
    }

    return {
      connected: true,
      tablesExist: true,
      message: "Database connection successful",
    };
  } catch (error) {
    return {
      connected: false,
      tablesExist: false,
      message: error.message,
    };
  }
}
export async function executeSQL(sql) {
  const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });


  if (error) throw error;
  return data;
}


export async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select("count", { count: "exact", head: true });

    return !error || !error.message.includes("does not exist");
  } catch {
    return false;
  }
}


export async function getTableCount(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count;
}

export default {
  testDatabaseConnection,
  executeSQL,
  tableExists,
  getTableCount,
};
