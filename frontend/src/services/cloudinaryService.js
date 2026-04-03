export const uploadImage = async (image) => {
  try {
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "societyhub_preset");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dsced0lrs/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();

    if (!result.secure_url) {
      console.error("Cloudinary error:", result);
      throw new Error("Image upload failed");
    }

    return result.secure_url;
  } catch (error) {
    console.error("Upload failed:", error);
    return "";
  }
};

export const uploadDocument = async (file) => {
  if (!file) return "";

  const data = new FormData();

  data.append("file", file);
  data.append("upload_preset", "societyhub_preset");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dsced0lrs/auto/upload",
    {
      method: "POST",
      body: data,
    }
  );

  const result = await res.json();

  if (!result.secure_url) {
    throw new Error("PDF upload failed");
  }

  return result.secure_url;
};
