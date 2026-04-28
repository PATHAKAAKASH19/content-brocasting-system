
import supabase from "../config/supabase.js";
import fs from "fs";
import path from "path";

class StorageService {
  async initBucket() {
    try {
     
      const { data: buckets, error: listError } =
        await supabase.storage.listBuckets();

      if (listError) {
        console.log("⚠️ Could not list buckets:", listError.message);
        return;
      }

      const bucketExists = buckets?.some(
        (bucket) => bucket.name === "content-uploads",
      );

      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(
          "content-uploads",
          {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024,
          },
        );

        if (createError) {
          console.log("⚠️ Could not create bucket:", createError.message);
        } else {
          console.log('✅ Storage bucket "content-uploads" created');
        }
      }
    } catch (error) {
      console.log("⚠️ Storage init error:", error.message);
    }
  }

  async uploadFile(localFilePath, fileName, contentType) {
    try {
  
      if (!fs.existsSync(localFilePath)) {
        throw new Error("File does not exist");
      }

     
      const fileBuffer = fs.readFileSync(localFilePath);

    
      const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `content/${uniqueFileName}`;

     
      const { data, error } = await supabase.storage
        .from("content-uploads")
        .upload(filePath, fileBuffer, {
          contentType: contentType,
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

    
      const {
        data: { publicUrl },
      } = supabase.storage.from("content-uploads").getPublicUrl(filePath);

     
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (err) {
        console.log("Could not delete local file:", err.message);
      }

      return {
        success: true,
        fileUrl: publicUrl,
        filePath: filePath,
        fileName: uniqueFileName,
      };
    } catch (error) {
      console.error("Upload error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from("content-uploads")
        .remove([filePath]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new StorageService();
