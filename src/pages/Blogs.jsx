import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  BookOpen, Plus, Search, Eye, Pencil, Trash2, Calendar, User,
  Loader2, X, Sparkles, Image as ImageIcon, Check, RefreshCw, Upload, Cloud
} from "lucide-react";
import * as api from "../api/blogs";

const SAMPLE_PRESET_IMAGES = [
  { label: "Healthy Food Bowl", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80" },
  { label: "Fresh Vegetables", url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80" },
  { label: "Hydration & Water", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80" },
  { label: "Portion Control", url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80" },
  { label: "Active Lifestyle", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80" },
];

function resolveImg(img) {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  return null;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [viewBlog, setViewBlog] = useState(null);
  const [editModal, setEditModal] = useState(null); // null | { mode: 'add'|'edit', blog?: {} }
  const [deletingId, setDeletingId] = useState(null);

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(h);
  }, [search]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getBlogs({ search: debouncedSearch, page, page_size: 9 });
      setBlogs(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const uniqueAuthorsCount = useMemo(() => {
    const authors = new Set(blogs.map(b => b.author).filter(Boolean));
    return authors.size || (blogs.length > 0 ? 1 : 0);
  }, [blogs]);

  const latestDate = useMemo(() => {
    if (!blogs || blogs.length === 0) return "Live";
    const dates = blogs.map(b => b.created_at ? new Date(b.created_at) : null).filter(Boolean);
    if (dates.length === 0) return "Active";
    const latest = new Date(Math.max(...dates));
    return latest.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }, [blogs]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the blog "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api.deleteBlog(id);
      fetchBlogs();
    } catch (err) {
      alert("Failed to delete blog: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {/* View Drawer */}
      {viewBlog && (
        <BlogReaderModal blog={viewBlog} onClose={() => setViewBlog(null)} />
      )}

      {/* Edit / Create Modal */}
      {editModal && (
        <BlogFormModal
          mode={editModal.mode}
          blog={editModal.blog}
          onClose={() => setEditModal(null)}
          onSaved={() => {
            setEditModal(null);
            fetchBlogs();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-orange-100/80 text-orange-700 border border-orange-200/60">
              Content Studio & Patient Wellness
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {totalCount} Articles Published
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Blogs & Educational Content
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Publish and curate nutritional wisdom, dietary formulations & patient lifestyle education
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBlogs()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setEditModal({ mode: "add" })}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm font-bold rounded-xl shadow-sm shadow-orange-500/20 transition cursor-pointer shrink-0"
          >
            <Plus size={16} /> New Article
          </button>
        </div>
      </div>

      {/* Executive Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Total Published",
            value: totalCount,
            sub: "Active mobile articles",
            icon: BookOpen,
            color: "text-orange-600",
            border: "border-orange-200",
            bg: "bg-orange-50 text-orange-700",
            active: !search,
            onClick: () => { setSearch(""); setPage(1); }
          },
          {
            label: "Clinical Authors",
            value: uniqueAuthorsCount,
            sub: "Contributing dietitians",
            icon: User,
            color: "text-blue-600",
            border: "border-blue-200",
            bg: "bg-blue-50 text-blue-700",
            active: false,
            onClick: () => { setSearch(""); setPage(1); }
          },
          {
            label: "Latest Publication",
            value: latestDate,
            sub: "Content freshness",
            icon: Calendar,
            color: "text-emerald-600",
            border: "border-emerald-200",
            bg: "bg-emerald-50 text-emerald-700",
            active: false,
            onClick: () => { setPage(1); }
          },
          {
            label: "Mobile Sync",
            value: "100% Live",
            sub: "Synchronized with app",
            icon: Sparkles,
            color: "text-purple-600",
            border: "border-purple-200",
            bg: "bg-purple-50 text-purple-700",
            active: false,
            onClick: () => { fetchBlogs(); }
          },
        ].map(({ label, value, sub, icon: Icon, color, border, bg, active, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 ${
              active
                ? `${border} ring-2 ring-orange-500/20 bg-white shadow-md`
                : "bg-white border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${color} tracking-tight`}>
              {loading ? "—" : value}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Topic Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "All Articles", query: "" },
          { label: "Nutrition & Diet", query: "nutrition" },
          { label: "Hydration & Health", query: "water" },
          { label: "Portion Control", query: "portion" },
          { label: "Active Lifestyle", query: "fitness" },
        ].map((pill) => {
          const isActive = (!pill.query && !search) || (pill.query && search.toLowerCase() === pill.query.toLowerCase());
          return (
            <button
              key={pill.label}
              onClick={() => {
                setSearch(pill.query);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title, topic, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 focus:bg-white transition font-medium"
          />
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900 font-black">{blogs.length}</span> of {totalCount} published articles
        </div>
      </div>

      {/* Blogs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-100 text-red-500 font-medium text-sm">
          {error}
        </div>
      ) : blogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <BookOpen size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">No blog articles found</p>
          <p className="text-xs text-gray-400 mt-1">Try another search term or publish a new article.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.map((blog) => {
            const resolvedImg = resolveImg(blog.image);

            return (
              <article
                key={blog.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Image banner */}
                <div className="h-44 bg-gradient-to-tr from-orange-400 via-amber-400 to-orange-500 relative overflow-hidden shrink-0">
                  {resolvedImg ? (
                    <img
                      src={resolvedImg}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/90 p-4 text-center">
                      <BookOpen size={32} className="mb-1 text-white" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">TrackIntake Wellness</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Nutrition & Health
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Calendar size={12} />
                      <span>
                        {blog.created_at
                          ? new Date(blog.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                          : "Recently"}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-gray-600 truncate max-w-[120px]">{blog.author_name || "Admin"}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>

                    <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {blog.content}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => setViewBlog(blog)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer"
                    >
                      <Eye size={14} /> Read Article
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditModal({ mode: "edit", blog })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Article"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={deletingId === blog.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                        title="Delete Article"
                      >
                        {deletingId === blog.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-40 transition cursor-pointer shadow-xs"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-gray-500 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 disabled:opacity-40 transition cursor-pointer shadow-xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function BlogReaderModal({ blog, onClose }) {
  const resolvedImg = resolveImg(blog.image);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700">
              Health Article
            </span>
            <span className="text-xs text-gray-400">
              {blog.created_at ? new Date(blog.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : ""}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
          {resolvedImg && (
            <div className="w-full h-64 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
              <img src={resolvedImg} alt={blog.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              {blog.title}
            </h2>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-medium">
              <span className="font-bold text-gray-800">By {blog.author_name || "Admin"}</span>
              {blog.author_email && <span>({blog.author_email})</span>}
            </div>
          </div>

          <div className="prose prose-orange max-w-none text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-6">
            {blog.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
}

function BlogFormModal({ mode, blog, onClose, onSaved }) {
  const [title, setTitle] = useState(blog ? blog.title : "");
  const [content, setContent] = useState(blog ? blog.content : "");
  const [image, setImage] = useState(blog ? blog.image || "" : "");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size must be under 10MB");
      return;
    }

    setUploadingImage(true);
    setUploadError("");

    try {
      const res = await api.uploadBlogImage(file);
      if (res && res.url) {
        setImage(res.url);
      } else {
        throw new Error("Upload did not return an image URL");
      }
    } catch (err) {
      setUploadError(err.message || "Failed to upload image to Cloudinary");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please drop an image file");
      return;
    }

    setUploadingImage(true);
    setUploadError("");
    try {
      const res = await api.uploadBlogImage(file);
      if (res && res.url) {
        setImage(res.url);
      }
    } catch (err) {
      setUploadError(err.message || "Failed to upload image to Cloudinary");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "add") {
        await api.createBlog({ title, content, image });
      } else {
        await api.updateBlog(blog.id, { title, content, image });
      }
      onSaved();
    } catch (err) {
      alert("Failed to save article: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isCloudinary = image && image.includes("res.cloudinary.com");

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {mode === "add" ? "Publish New Article" : "Edit Article"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Share dietary wisdom, clinical insights, and habit tips with patients</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Article Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. The Science of Hydration and Metabolism"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 font-semibold text-gray-800"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <ImageIcon size={14} className="text-orange-500" />
                Cover Image
              </label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Cloud size={10} /> Cloudinary CDN
                </span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-slate-500 hover:text-orange-600 font-medium underline cursor-pointer"
                >
                  {showUrlInput ? "Hide Direct URL" : "Enter URL manually"}
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />

            {/* Direct Upload Dropzone */}
            {!image ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  uploadingImage
                    ? "border-orange-300 bg-orange-50/50"
                    : "border-slate-300 hover:border-orange-400 hover:bg-orange-50/30 bg-slate-50/50"
                }`}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 size={28} className="animate-spin text-orange-500" />
                    <p className="text-sm font-bold text-orange-600">Uploading image to Cloudinary...</p>
                    <p className="text-xs text-slate-400">Optimizing and storing securely on CDN</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                      <Upload size={22} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-800">
                        Click to upload or drag & drop image
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Direct upload to Cloudinary (PNG, JPG, WEBP up to 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Uploaded Image Preview */
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                <img
                  src={image}
                  alt="Blog Cover"
                  className="w-full h-44 object-cover object-center group-hover:opacity-90 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCloudinary ? "bg-emerald-500 text-white" : "bg-black/60 text-white"
                    }`}>
                      {isCloudinary ? <><Check size={11} /> Cloudinary Hosted</> : "Custom URL"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="p-1.5 rounded-xl bg-black/60 hover:bg-red-600 text-white transition cursor-pointer"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/80 font-mono truncate max-w-[70%]">
                      {image}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <p className="text-xs text-red-600 font-medium mt-1.5 bg-red-50 p-2 rounded-lg border border-red-200">
                {uploadError}
              </p>
            )}

            {/* Manual URL Input (Optional) */}
            {showUrlInput && (
              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="https://res.cloudinary.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700"
                />
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-2.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Or choose a quick preset:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer font-medium ${
                      image === preset.url
                        ? "bg-orange-100 text-orange-700 border-orange-300 font-bold"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Article Body / Content *</label>
            <textarea
              required
              rows={8}
              placeholder="Write the educational content or clinical guide here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 leading-relaxed font-normal"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploadingImage}
              className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex-1 px-4 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? "Saving..." : (mode === "add" ? "Publish Article" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
