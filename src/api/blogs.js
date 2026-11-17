import { API_BASE_URL } from "../config";

export async function getBlogs(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", params.page);
  if (params.page_size) query.set("page_size", params.page_size);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/blogs/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch blogs");
  return res.json();
}

export async function getBlogDetail(id) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/blogs/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch blog details");
  return res.json();
}

export async function createBlog(data) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/blogs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create blog");
  return res.json();
}

export async function updateBlog(id, data) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/blogs/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update blog");
  return res.json();
}

export async function deleteBlog(id) {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/blogs/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete blog");
  return res.json();
}

export async function uploadBlogImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE_URL}/api/dashboard/blogs/upload-image/`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload image to Cloudinary");
  }
  return res.json();
}


