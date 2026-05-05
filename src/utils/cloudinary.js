/**
 * Upload a file to Cloudinary.
 * For images / videos uses /auto/upload (Cloudinary picks the type).
 * For PDFs and other documents forces /raw/upload so the file is always
 * stored and served as a raw asset — avoiding 401 "not an image" errors.
 */
export const uploadToCloudinary = async (file, resourceType = "auto") => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary credentials missing in .env (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)",
    );
  }

  // Detect non-image / non-video files and force raw resource type
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const resolvedType = isImage || isVideo ? "auto" : "raw";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resolvedType}/upload`,
    { method: "POST", body: formData },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
};
