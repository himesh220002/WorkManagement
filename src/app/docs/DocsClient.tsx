"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Briefcase,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Folder,
  User,
  X,
  Archive,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  ArrowUp,
  ArrowDown,
  Plus,
  Minimize2,
  SlidersHorizontal,
  Image as ImageIcon,
  HardDrive,
  Sparkles,
  CheckSquare,
  Square,
} from "lucide-react";
import { DocumentCategory } from "@/models/types";
import { DOCUMENT_CATEGORY_CONFIGS, validateDocumentFile } from "@/config/documentLimits";
import { isImageFile, compressImageFile, mergeImagesToPdf } from "@/utils/imageCompressor";

export interface BatchPageItem {
  id: string;
  file: File;
  compressedFile?: File;
  name: string;
  size: number;
  previewUrl: string | null;
  isImage: boolean;
  applySizeReducer: boolean;
  compressedSize?: number;
  reductionPercent?: number;
  exceedsLimit: boolean;
}

interface EntityOption {
  id: string;
  name: string;
  category?: string;
  role?: string;
  email?: string;
}

interface DocItem {
  _id: string;
  title: string;
  originalName: string;
  category: DocumentCategory;
  subType?: string;
  entityId: string | null;
  entityName?: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  uploadedByName: string;
  uploadedByRole: string;
  uploadedById: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdAt: string;
}

interface DocsClientProps {
  companyCode: string;
  companyId: string;
  companyName: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  projects: EntityOption[];
  users: EntityOption[];
  pipelines: EntityOption[];
  deals: EntityOption[];
  initialDocuments: DocItem[];
}

type TabType = "ALL" | DocumentCategory | "ARCHIVE";

export default function DocsClient({
  companyCode,
  companyId,
  companyName,
  currentUser,
  projects,
  users,
  pipelines,
  deals,
  initialDocuments,
}: DocsClientProps) {
  const [documents, setDocuments] = useState<DocItem[]>(initialDocuments);

  // Upload Form State
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("PROJECT");
  const [selectedSubtype, setSelectedSubtype] = useState<string>(
    DOCUMENT_CATEGORY_CONFIGS.PROJECT.subtypes[0] || ""
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    projects.length > 0 ? projects[0].id : ""
  );
  const [docTitle, setDocTitle] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<BatchPageItem[]>([]);
  const [uploadMode, setUploadMode] = useState<"merge_pdf" | "batch_layers">("merge_pdf");

  // Upload progress and alerts
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Branch-by-Branch Filter States
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [selectedFilterEntity, setSelectedFilterEntity] = useState<string>("ALL");
  const [selectedFilterSubtype, setSelectedFilterSubtype] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State (Max 50 results per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Actions state
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null);
  const presignedUrlCache = useRef<Map<string, { url: string; expiresAt: number }>>(new Map());

  // Hover Peek State (400x300px quick preview)
  const [peekState, setPeekState] = useState<{
    doc: DocItem;
    rect: DOMRect;
    url: string | null;
    isLoading: boolean;
  } | null>(null);
  const peekTimerRef = useRef<NodeJS.Timeout | null>(null);
  const peekCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Strict Delete Modal State for Manager/Owner
  const [deleteModalDoc, setDeleteModalDoc] = useState<DocItem | null>(null);
  const [deleteScope, setDeleteScope] = useState<"vault_only" | "both">("vault_only");
  const [deleteConfirmationConfirmed, setDeleteConfirmationConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryConfig = DOCUMENT_CATEGORY_CONFIGS[selectedCategory];
  const isManagerOrOwner = ["superuser", "owner", "manager"].includes(currentUser.role);

  // Batch Size Computations
  const totalRawSize = useMemo(() => {
    return batchFiles.reduce((acc, item) => acc + item.size, 0);
  }, [batchFiles]);

  const totalProjectedSize = useMemo(() => {
    return batchFiles.reduce((acc, item) => {
      if (item.applySizeReducer && item.compressedSize) {
        return acc + item.compressedSize;
      }
      return acc + item.size;
    }, 0);
  }, [batchFiles]);

  const hasOversizedWithoutReducer = useMemo(() => {
    const maxBytes = categoryConfig.maxSizeMB * 1024 * 1024;
    return batchFiles.some((item) => !item.applySizeReducer && item.size > maxBytes);
  }, [batchFiles, categoryConfig.maxSizeMB]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      batchFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [batchFiles]);

  // Helper to resolve entity display name
  const resolveEntityName = (cat: DocumentCategory, entityId: string | null): string => {
    if (!entityId) return "Organization General / Unassigned";
    if (cat === "PROJECT") {
      const found = projects.find((p) => p.id === entityId);
      return found ? found.name : "General Project Asset";
    } else if (cat === "EMPLOYEE") {
      const found = users.find((u) => u.id === entityId);
      return found ? `${found.name} (${found.role})` : "General Staff Record";
    } else if (cat === "SALES") {
      const found = deals.find((d) => d.id === entityId);
      return found ? found.name : "General Sales Asset";
    } else if (cat === "SALARY_FINANCE") {
      const found = users.find((u) => u.id === entityId);
      return found ? `${found.name} (Payroll)` : "Organization General Treasury";
    }
    return "Organization General / Unassigned";
  };

  // Handle category change in upload form
  const handleCategoryChange = (cat: DocumentCategory) => {
    setSelectedCategory(cat);
    const newConfig = DOCUMENT_CATEGORY_CONFIGS[cat];
    const defaultSub = newConfig.subtypes[0] || "";
    setSelectedSubtype(defaultSub);
    setDocTitle(defaultSub);
    setErrorMessage("");

    const newMaxBytes = newConfig.maxSizeMB * 1024 * 1024;
    // Re-evaluate batch items for the new category limit
    setBatchFiles((prev) =>
      prev.map((item) => {
        const exceeds = item.size > newMaxBytes;
        return {
          ...item,
          exceedsLimit: exceeds,
          applySizeReducer: exceeds && item.isImage ? true : item.applySizeReducer,
        };
      })
    );

    // Set sensible default entity
    if (cat === "EMPLOYEE") {
      setSelectedEntityId(currentUser.id);
    } else if (cat === "PROJECT" && projects.length > 0) {
      setSelectedEntityId(projects[0].id);
    } else if (cat === "SALES" && deals.length > 0) {
      setSelectedEntityId(deals[0].id);
    } else if (cat === "SALARY_FINANCE") {
      setSelectedEntityId(currentUser.id);
    } else {
      setSelectedEntityId("");
    }
  };

  const handleSubtypeSelect = (subtype: string) => {
    setSelectedSubtype(subtype);
    setDocTitle(subtype);
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const maxBytes = categoryConfig.maxSizeMB * 1024 * 1024;
    const newItems: BatchPageItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Validate format
      const validation = validateDocumentFile(selectedCategory, file.size, file.name, file.type);
      if (!validation.valid && validation.error?.includes("extension")) {
        setErrorMessage(validation.error);
        continue;
      }

      const isImg = isImageFile(file);
      const exceeds = file.size > maxBytes;
      const previewUrl = isImg ? URL.createObjectURL(file) : null;

      let compressedFile: File | undefined;
      let compressedSize: number | undefined;
      let reductionPercent: number | undefined;

      // Automatically precalculate compression for images so reduction stats show immediately
      if (isImg) {
        try {
          const comp = await compressImageFile(file, 0.68, 1600);
          compressedFile = comp.file;
          compressedSize = comp.compressedSize;
          reductionPercent = comp.reductionPercent;
        } catch (err) {
          console.warn("Failed to precompute image compression:", err);
        }
      }

      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        compressedFile,
        name: file.name,
        size: file.size,
        previewUrl,
        isImage: isImg,
        applySizeReducer: exceeds && isImg, // auto-checked if exceeds limit so user doesn't hit wall
        compressedSize,
        reductionPercent,
        exceedsLimit: exceeds,
      });
    }

    if (newItems.length === 0) return;

    setBatchFiles((prev) => {
      const updated = [...prev, ...newItems];
      if (updated.length === 1) {
        setSelectedFile(
          updated[0].applySizeReducer && updated[0].compressedFile
            ? updated[0].compressedFile
            : updated[0].file
        );
      } else {
        setSelectedFile(null);
      }
      return updated;
    });

    setErrorMessage("");

    if (!docTitle || docTitle === selectedSubtype) {
      if (newItems.length === 1 && batchFiles.length === 0) {
        const cleanName = newItems[0].name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setDocTitle(`${selectedSubtype || categoryConfig.label} - ${cleanName}`);
      } else {
        const totalCount = batchFiles.length + newItems.length;
        setDocTitle(`${selectedSubtype || categoryConfig.label} - Batch Scan (${totalCount} Pages)`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeBatchItem = (id: string) => {
    setBatchFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 1) {
        setSelectedFile(
          updated[0].applySizeReducer && updated[0].compressedFile
            ? updated[0].compressedFile
            : updated[0].file
        );
      } else if (updated.length === 0) {
        setSelectedFile(null);
      }
      return updated;
    });
  };

  const toggleItemReducer = (id: string) => {
    setBatchFiles((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          applySizeReducer: !item.applySizeReducer,
        };
      })
    );
  };

  const autoReduceOversized = () => {
    setBatchFiles((prev) =>
      prev.map((item) => ({
        ...item,
        applySizeReducer: item.isImage && (item.exceedsLimit || item.applySizeReducer),
      }))
    );
  };

  const toggleAllReducers = (apply: boolean) => {
    setBatchFiles((prev) =>
      prev.map((item) => ({
        ...item,
        applySizeReducer: item.isImage ? apply : false,
      }))
    );
  };

  const moveBatchItem = (index: number, direction: "up" | "down") => {
    setBatchFiles((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const clearBatch = () => {
    batchFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setBatchFiles([]);
    setSelectedFile(null);
    const fileInput = document.getElementById("doc-file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    const addMoreInput = document.getElementById("doc-add-more-pages") as HTMLInputElement;
    if (addMoreInput) addMoreInput.value = "";
  };

  const uploadSingleFileRecord = async (
    fileToUpload: File,
    title: string,
    onProgressText?: (msg: string) => void
  ): Promise<DocItem> => {
    if (onProgressText) onProgressText(`Requesting S3 Presigned Upload URL for ${fileToUpload.name}...`);

    const presignRes = await fetch(`/api/${companyCode}/docs/presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: selectedCategory,
        entityId: selectedEntityId || null,
        fileName: fileToUpload.name,
        mimeType: fileToUpload.type || "application/octet-stream",
        fileSize: fileToUpload.size,
      }),
    });

    const presignData = await presignRes.json();
    if (!presignRes.ok || !presignData.success) {
      throw new Error(presignData.error || `Failed to generate presigned upload URL for ${fileToUpload.name}.`);
    }

    const { uploadUrl, s3Key, isMock } = presignData.data;
    let savedRecord: any = null;
    let directS3Success = false;

    if (!isMock) {
      if (onProgressText) onProgressText(`Uploading ${fileToUpload.name} securely to AWS S3...`);
      try {
        const s3UploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: fileToUpload,
          headers: {
            "Content-Type": fileToUpload.type || "application/octet-stream",
          },
        });

        if (s3UploadRes.ok) {
          directS3Success = true;
        } else {
          console.warn(`Direct S3 upload returned HTTP ${s3UploadRes.status}. Using server upload fallback...`);
        }
      } catch (fetchErr) {
        console.warn("Direct S3 upload encountered network/CORS error. Using server fallback...", fetchErr);
      }
    } else {
      directS3Success = true;
    }

    if (directS3Success) {
      if (onProgressText) onProgressText(`Saving metadata in database for ${title}...`);
      const saveRes = await fetch(`/api/${companyCode}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          subType: selectedSubtype,
          entityId: selectedEntityId || null,
          title: title.trim(),
          originalName: fileToUpload.name,
          mimeType: fileToUpload.type || "application/octet-stream",
          fileSize: fileToUpload.size,
          s3Key,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || `Failed to record metadata for ${fileToUpload.name}.`);
      }
      savedRecord = saveData.data;
    } else {
      if (onProgressText) onProgressText(`Direct S3 restricted; uploading ${fileToUpload.name} via server fallback...`);
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("category", selectedCategory);
      formData.append("subType", selectedSubtype);
      if (selectedEntityId) formData.append("entityId", selectedEntityId);
      formData.append("title", title.trim());

      const serverUploadRes = await fetch(`/api/${companyCode}/docs/upload-direct`, {
        method: "POST",
        body: formData,
      });

      const serverData = await serverUploadRes.json();
      if (!serverUploadRes.ok || !serverData.success) {
        throw new Error(serverData.error || `Server upload fallback failed for ${fileToUpload.name}.`);
      }
      savedRecord = serverData.data;
    }

    const resolvedEntityName = resolveEntityName(selectedCategory, selectedEntityId);

    return {
      _id: savedRecord._id,
      title: savedRecord.title,
      originalName: savedRecord.originalName,
      category: savedRecord.category,
      subType: selectedSubtype || savedRecord.subType || "General Document",
      entityId: savedRecord.entityId,
      entityName: resolvedEntityName,
      mimeType: savedRecord.mimeType,
      fileSize: savedRecord.fileSize,
      s3Key: savedRecord.s3Key,
      uploadedByName: currentUser.name,
      uploadedByRole: currentUser.role,
      uploadedById: currentUser.id,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date().toISOString(),
    };
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveBatch = [...batchFiles];
    if (effectiveBatch.length === 0 && selectedFile) {
      const isImg = isImageFile(selectedFile);
      effectiveBatch.push({
        id: `${Date.now()}`,
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
        previewUrl: null,
        isImage: isImg,
        applySizeReducer: false,
        exceedsLimit: selectedFile.size > categoryConfig.maxSizeMB * 1024 * 1024,
      });
    }

    if (effectiveBatch.length === 0) {
      setErrorMessage("Please select at least one file or page to upload.");
      return;
    }

    if (!docTitle.trim()) {
      setErrorMessage("Please enter a title for the document.");
      return;
    }

    const maxBytes = categoryConfig.maxSizeMB * 1024 * 1024;

    // Check if any file exceeds limit without size reducer applied
    for (let i = 0; i < effectiveBatch.length; i++) {
      const item = effectiveBatch[i];
      const effectiveSize =
        item.applySizeReducer && item.compressedSize ? item.compressedSize : item.file.size;
      if (effectiveSize > maxBytes) {
        if (!item.applySizeReducer && item.isImage) {
          setErrorMessage(
            `Page ${i + 1} ("${item.name}") is ${(item.file.size / 1048576).toFixed(2)} MB, exceeding the ${categoryConfig.maxSizeMB} MB limit for ${categoryConfig.label}. Please tick "Apply Size Reducer" to dull quality and compress it.`
          );
        } else {
          setErrorMessage(
            `Page ${i + 1} ("${item.name}") exceeds the ${categoryConfig.maxSizeMB} MB limit even after reduction (${(effectiveSize / 1048576).toFixed(2)} MB). Please select a smaller file.`
          );
        }
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Determine if merging into single multi-page PDF
      const canMergePdf =
        effectiveBatch.length > 1 &&
        uploadMode === "merge_pdf" &&
        effectiveBatch.every((item) => item.isImage);

      if (effectiveBatch.length === 1 || canMergePdf) {
        let finalFile: File;

        if (canMergePdf) {
          setUploadStatusMsg(`Combining & layering ${effectiveBatch.length} pages into 1 multi-page PDF...`);
          setUploadProgress(20);

          // Build resolved files, honoring per-file reducer tick mark
          const resolvedFiles: File[] = [];
          for (const item of effectiveBatch) {
            if (item.applySizeReducer && item.compressedFile) {
              resolvedFiles.push(item.compressedFile);
            } else if (item.applySizeReducer && item.isImage) {
              const comp = await compressImageFile(item.file, 0.68, 1600);
              resolvedFiles.push(comp.file);
            } else {
              resolvedFiles.push(item.file);
            }
          }

          finalFile = await mergeImagesToPdf(resolvedFiles, docTitle.trim());

          if (finalFile.size > maxBytes) {
            throw new Error(
              `Combined PDF is ${(finalFile.size / 1048576).toFixed(2)} MB, which exceeds the ${categoryConfig.maxSizeMB} MB limit for ${categoryConfig.label}. Please tick "Apply Size Reducer" on more pages.`
            );
          }
        } else {
          // Single file
          const singleItem = effectiveBatch[0];
          if (singleItem.applySizeReducer && singleItem.compressedFile) {
            finalFile = singleItem.compressedFile;
          } else if (singleItem.applySizeReducer && singleItem.isImage) {
            const comp = await compressImageFile(singleItem.file, 0.68, 1600);
            finalFile = comp.file;
          } else {
            finalFile = singleItem.file;
          }
        }

        const newDoc = await uploadSingleFileRecord(finalFile, docTitle.trim(), (msg) => {
          setUploadStatusMsg(msg);
        });

        setDocuments((prev) => [newDoc, ...prev]);
        setUploadProgress(100);
        setSuccessMessage(
          canMergePdf
            ? `Successfully merged ${effectiveBatch.length} pages into 1 PDF ("${docTitle}") and uploaded to S3!`
            : `Document "${docTitle}" successfully uploaded to S3 and stored in ${companyName}!`
        );
      } else {
        // Individual layered page sequence upload
        const createdDocs: DocItem[] = [];
        const total = effectiveBatch.length;

        for (let i = 0; i < total; i++) {
          const item = effectiveBatch[i];
          const pageTitle = `${docTitle.trim()} (Page ${i + 1} of ${total})`;
          setUploadProgress(Math.round(15 + ((i) / total) * 80));

          let pageFile: File;
          if (item.applySizeReducer && item.compressedFile) {
            pageFile = item.compressedFile;
          } else if (item.applySizeReducer && item.isImage) {
            const comp = await compressImageFile(item.file, 0.68, 1600);
            pageFile = comp.file;
          } else {
            pageFile = item.file;
          }

          const newDoc = await uploadSingleFileRecord(pageFile, pageTitle, (msg) => {
            setUploadStatusMsg(`[Page ${i + 1}/${total}] ${msg}`);
          });
          createdDocs.push(newDoc);
        }

        setDocuments((prev) => [...createdDocs, ...prev]);
        setUploadProgress(100);
        setSuccessMessage(
          `Successfully uploaded all ${total} document pages as individual layers to S3!`
        );
      }

      clearBatch();
      setDocTitle(selectedSubtype);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during document upload.");
    } finally {
      setIsUploading(false);
      setUploadStatusMsg("");
    }
  };

  const handleViewDocument = async (docId: string) => {
    // Check client-side cache first (presigned URLs valid for 60s, cached for 50s)
    const cached = presignedUrlCache.current.get(docId);
    if (cached && Date.now() < cached.expiresAt) {
      window.open(cached.url, "_blank", "noopener,noreferrer");
      return;
    }

    setViewingDocId(docId);
    try {
      const res = await fetch(`/api/${companyCode}/docs/${docId}/view`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Unable to view document. Access denied or expired.");
        return;
      }
      presignedUrlCache.current.set(docId, {
        url: data.data.viewUrl,
        expiresAt: Date.now() + 50 * 1000,
      });
      window.open(data.data.viewUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      alert("Error retrieving presigned view URL: " + err.message);
    } finally {
      setViewingDocId(null);
    }
  };

  // Close peek on window scroll so it doesn't get detached from the row
  useEffect(() => {
    const handleScroll = () => {
      if (peekState) {
        setPeekState(null);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [peekState]);

  const handleFileMouseEnter = (doc: DocItem, e: React.MouseEvent<HTMLElement>) => {
    if (peekCloseTimerRef.current) {
      clearTimeout(peekCloseTimerRef.current);
      peekCloseTimerRef.current = null;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
    }

    // Small debounce (120ms) to avoid accidental popups on rapid mouse moves
    peekTimerRef.current = setTimeout(async () => {
      const cached = presignedUrlCache.current.get(doc._id);
      if (cached && Date.now() < cached.expiresAt) {
        setPeekState({
          doc,
          rect,
          url: cached.url,
          isLoading: false,
        });
        return;
      }

      setPeekState({
        doc,
        rect,
        url: null,
        isLoading: true,
      });

      try {
        const res = await fetch(`/api/${companyCode}/docs/${doc._id}/view`);
        const data = await res.json();
        if (res.ok && data.success && data.data?.viewUrl) {
          presignedUrlCache.current.set(doc._id, {
            url: data.data.viewUrl,
            expiresAt: Date.now() + 50 * 1000,
          });
          setPeekState((prev) =>
            prev && prev.doc._id === doc._id
              ? { ...prev, url: data.data.viewUrl, isLoading: false }
              : prev
          );
        } else {
          setPeekState((prev) =>
            prev && prev.doc._id === doc._id ? { ...prev, isLoading: false } : prev
          );
        }
      } catch {
        setPeekState((prev) =>
          prev && prev.doc._id === doc._id ? { ...prev, isLoading: false } : prev
        );
      }
    }, 120);
  };

  const handleFileMouseLeave = () => {
    if (peekTimerRef.current) {
      clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }

    // Grace window of 250ms so user can move mouse onto the 400x300 preview card
    peekCloseTimerRef.current = setTimeout(() => {
      setPeekState(null);
    }, 250);
  };

  const handlePeekMouseEnter = () => {
    if (peekCloseTimerRef.current) {
      clearTimeout(peekCloseTimerRef.current);
      peekCloseTimerRef.current = null;
    }
  };

  const handlePeekMouseLeave = () => {
    setPeekState(null);
  };

  // Archive / Restore Handler
  const handleArchiveToggle = async (docId: string, currentArchived: boolean, docTitle: string) => {
    const action = currentArchived ? "restore" : "archive";
    setIsArchivingId(docId);
    try {
      const res = await fetch(`/api/${companyCode}/docs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || `Failed to ${action} document.`);
        return;
      }

      setDocuments((prev) =>
        prev.map((d) => (d._id === docId ? { ...d, isArchived: !currentArchived } : d))
      );
    } catch (err: any) {
      alert(`Error during document ${action}: ` + err.message);
    } finally {
      setIsArchivingId(null);
    }
  };

  // Open Manager/Owner Strict Delete Modal
  const handleOpenDeleteModal = (doc: DocItem) => {
    setDeleteModalDoc(doc);
    setDeleteScope("vault_only");
    setDeleteConfirmationConfirmed(false);
  };

  // Execute Strict Deletion
  const handleExecuteDelete = async () => {
    if (!deleteModalDoc || !deleteConfirmationConfirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/${companyCode}/docs?docId=${deleteModalDoc._id}&scope=${deleteScope}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to delete document.");
        return;
      }

      setDocuments((prev) => prev.filter((d) => d._id !== deleteModalDoc._id));
      setDeleteModalDoc(null);
    } catch (err: any) {
      alert("Error deleting document: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Switch category filter and reset child branch filters
  const handleCategoryFilterChange = (cat: TabType) => {
    setActiveTab(cat);
    setSelectedFilterEntity("ALL");
    setSelectedFilterSubtype("ALL");
    setCurrentPage(1);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setActiveTab("ALL");
    setSelectedFilterEntity("ALL");
    setSelectedFilterSubtype("ALL");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Split Active Working Area Documents vs Archived Documents
  const activeDocuments = useMemo(() => documents.filter((d) => !d.isArchived), [documents]);
  const archivedDocuments = useMemo(() => documents.filter((d) => Boolean(d.isArchived)), [documents]);

  // Counts
  const countProjects = useMemo(() => activeDocuments.filter((d) => d.category === "PROJECT").length, [activeDocuments]);
  const countEmployees = useMemo(() => activeDocuments.filter((d) => d.category === "EMPLOYEE").length, [activeDocuments]);
  const countSales = useMemo(() => activeDocuments.filter((d) => d.category === "SALES").length, [activeDocuments]);
  const countFinance = useMemo(() => activeDocuments.filter((d) => d.category === "SALARY_FINANCE").length, [activeDocuments]);
  const countArchived = archivedDocuments.length;

  // Options for Branch 1: Sub-Type Dropdown Filter
  const availableSubtypes = useMemo(() => {
    if (activeTab === "ALL" || activeTab === "ARCHIVE") {
      const uniqueSubtypes = new Set<string>();
      Object.values(DOCUMENT_CATEGORY_CONFIGS).forEach((c) => {
        c.subtypes.forEach((s) => uniqueSubtypes.add(s));
      });
      documents.forEach((d) => {
        if (d.subType) uniqueSubtypes.add(d.subType);
      });
      return Array.from(uniqueSubtypes);
    }
    const configSubs = DOCUMENT_CATEGORY_CONFIGS[activeTab]?.subtypes || [];
    const extraSubs = documents
      .filter((d) => d.category === activeTab && d.subType)
      .map((d) => d.subType as string);
    return Array.from(new Set([...configSubs, ...extraSubs]));
  }, [activeTab, documents]);

  // Dynamic Table Column Header label for the Target Entity
  const entityColumnHeader = useMemo(() => {
    switch (activeTab) {
      case "PROJECT":
        return "Project";
      case "EMPLOYEE":
        return "Member";
      case "SALES":
        return "Sales / Deal";
      case "SALARY_FINANCE":
        return "Payroll";
      case "ARCHIVE":
        return "Target (Project / Member / Deal / Payroll)";
      case "ALL":
      default:
        return "Project / Member / Deal / Payroll";
    }
  }, [activeTab]);

  // Filtered documents list applying cascading branch-by-branch conditions
  const filteredDocuments = useMemo(() => {
    const baseDocs = activeTab === "ARCHIVE" ? archivedDocuments : activeDocuments;
    return baseDocs.filter((doc) => {
      // 1. Category check
      const matchesCategory =
        activeTab === "ALL" ||
        activeTab === "ARCHIVE" ||
        doc.category === activeTab;
      if (!matchesCategory) return false;

      // 2. Target Entity branch filter
      let matchesEntity = true;
      if (selectedFilterEntity !== "ALL") {
        if (selectedFilterEntity === "general") {
          matchesEntity = !doc.entityId || doc.entityId === "general";
        } else {
          matchesEntity = doc.entityId === selectedFilterEntity;
        }
      }
      if (!matchesEntity) return false;

      // 3. Subtype branch filter
      let matchesSubtype = true;
      if (selectedFilterSubtype !== "ALL") {
        const docSub = (doc.subType || "").toLowerCase();
        const targetSub = selectedFilterSubtype.toLowerCase();
        matchesSubtype = docSub === targetSub || docSub.includes(targetSub) || targetSub.includes(docSub);
      }
      if (!matchesSubtype) return false;

      // 4. Text Search Ahead
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          doc.title.toLowerCase().includes(q) ||
          doc.originalName.toLowerCase().includes(q) ||
          (doc.subType && doc.subType.toLowerCase().includes(q)) ||
          (doc.entityName && doc.entityName.toLowerCase().includes(q)) ||
          doc.uploadedByName.toLowerCase().includes(q) ||
          doc.uploadedByRole.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [activeDocuments, archivedDocuments, activeTab, selectedFilterEntity, selectedFilterSubtype, searchQuery]);

  const hasActiveFilters =
    activeTab !== "ALL" ||
    selectedFilterEntity !== "ALL" ||
    selectedFilterSubtype !== "ALL" ||
    searchQuery.trim().length > 0;

  // Pagination Calculations (Max 50 results per page)
  const totalResults = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);

  const paginatedDocuments = useMemo(() => {
    return filteredDocuments.slice(startIndex, endIndex);
  }, [filteredDocuments, startIndex, endIndex]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#18181B] text-[#242424] dark:text-[#E4E4E7] p-2 sm:p-4">
      {/* Header Banner */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                AWS S3 Enterprise Vault
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {companyCode}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Enterprise Document Storage & S3 Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              Direct-to-S3 presigned transfers with strict role-based access control, isolated tenant paths, and custom size restrictions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-zinc-400">Connected AWS Bucket</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                <ShieldCheck className="w-4 h-4" /> taskflow-pm-storage-prod (ap-south-1)
              </p>
            </div>
          </div>
        </div>

        {/* Upload Form Card */}
        <div className="mt-8 bg-white dark:bg-[#202024] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-4 sm:p-8">
          <div className="flex items-center gap-3 pb-5 border-b border-gray-100 dark:border-zinc-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Upload Document</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Select your document category to automatically configure allowed file types, size limits, and S3 folder paths.
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="mt-6 space-y-6">
            {/* Step 1: Category Selector Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-2">
                  1. Document Category & Access Tier *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as DocumentCategory)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="PROJECT">📁 Project & Engineering Deliverables (Max 25 MB)</option>
                  <option value="EMPLOYEE">👤 Employee & Onboarding Records (Max 5 MB)</option>
                  <option value="SALES">💼 Sales Decks & Client Contracts (Max 15 MB)</option>
                  <option value="SALARY_FINANCE">💰 Salary, Payroll & Finance (Max 10 MB)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5">{categoryConfig.description}</p>
              </div>

              {/* Step 2: Subtype Quick-Pick Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-2">
                  2. Document Sub-Type (Quick Pre-Fill) *
                </label>
                <select
                  value={selectedSubtype}
                  onChange={(e) => handleSubtypeSelect(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  {categoryConfig.subtypes.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5">
                  Select a document template or specialization to prefill metadata.
                </p>
              </div>
            </div>

            {/* Step 3: Dynamic Entity Context Dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-2">
                  3. Linked Entity Context ({selectedCategory === "EMPLOYEE" ? "Staff Member" : selectedCategory === "PROJECT" ? "Target Project" : selectedCategory === "SALES" ? "Client / Deal" : "Payroll Staff Member"})
                </label>

                {selectedCategory === "EMPLOYEE" && (
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) - {u.email}
                      </option>
                    ))}
                    <option value="">General Staff Record</option>
                  </select>
                )}

                {selectedCategory === "PROJECT" && (
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {projects.length > 0 ? (
                      projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.category}]
                        </option>
                      ))
                    ) : (
                      <option value="">No projects available (General Project Spec)</option>
                    )}
                    <option value="">General Project Asset</option>
                  </select>
                )}

                {selectedCategory === "SALES" && (
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {deals.length > 0 ? (
                      deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <option value="">General Sales Pipeline Asset</option>
                    )}
                    <option value="">General Sales Material</option>
                  </select>
                )}

                {selectedCategory === "SALARY_FINANCE" && (
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Organization General Balance Sheet / Treasury</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        Individual Salary Slip: {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-2">
                  4. Document Title *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Q3 Architecture Blueprint"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#27272A] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Step 4: Batch Multi-Page Upload & Size Reducer Manager */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  5. Document File(s) & Batch Page Layers *
                </label>
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  Multi-page scans (2–10 pages) supported • Allowed: {categoryConfig.allowedExtensions.join(", ")}
                </span>
              </div>

              {batchFiles.length === 0 ? (
                /* Empty State Dropzone */
                <div className="relative border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50/50 dark:bg-zinc-900/50">
                  <input
                    id="doc-file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept={categoryConfig.allowedExtensions.join(",")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />

                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="p-3.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
                      <UploadCloud className="w-8 h-8" />
                    </div>

                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                      Drag and drop single file or multi-page batch (2–10 pages), or click to browse
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-md">
                      Snapping document photos? Upload multiple pages at once. Merge them into 1 unified layered PDF with selective quality reduction.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[11px] text-gray-600 dark:text-zinc-400">
                      <span>Vault Limit: <strong className="text-gray-900 dark:text-white">{categoryConfig.maxSizeMB} MB</strong></span>
                      <span>•</span>
                      <span>Formats: {categoryConfig.allowedExtensions.join(", ")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Batch File & Layer Manager */
                <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 bg-gray-50/60 dark:bg-zinc-900/70 space-y-4">
                  {/* Batch Summary & Controls Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                        {batchFiles.length} {batchFiles.length === 1 ? "Page / File" : "Pages / Files"}
                      </span>

                      {batchFiles.length > 1 && (
                        <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800 text-xs">
                          <button
                            type="button"
                            onClick={() => setUploadMode("merge_pdf")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                              uploadMode === "merge_pdf"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-gray-600 dark:text-zinc-400 hover:text-gray-900"
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Merge into 1 Multi-Page PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadMode("batch_layers")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                              uploadMode === "batch_layers"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-gray-600 dark:text-zinc-400 hover:text-gray-900"
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Separate Pages
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Batch Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={autoReduceOversized}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 hover:bg-amber-200 transition-colors flex items-center gap-1"
                        title="Automatically tick Apply Size Reducer for files exceeding category limits"
                      >
                        <Minimize2 className="w-3 h-3" /> Auto-Reduce Oversized
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAllReducers(true)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        Reduce All
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAllReducers(false)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        Keep All Original
                      </button>
                      <button
                        type="button"
                        onClick={clearBatch}
                        className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  </div>

                  {/* Size Stat Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-gray-500 dark:text-zinc-400">Total Raw: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(totalRawSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-zinc-400">Projected Upload: </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {(totalProjectedSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-zinc-400">Vault Limit: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {categoryConfig.maxSizeMB} MB
                        </span>
                      </div>
                    </div>

                    <div>
                      {hasOversizedWithoutReducer ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Tick "Apply Size Reducer" on oversized page(s) below
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          All pages within vault limits
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Page Item Cards List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {batchFiles.map((item, idx) => {
                      const effectiveSize =
                        item.applySizeReducer && item.compressedSize
                          ? item.compressedSize
                          : item.size;
                      const isStillOversized =
                        effectiveSize > categoryConfig.maxSizeMB * 1024 * 1024;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isStillOversized
                              ? "bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800"
                              : item.applySizeReducer
                              ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                              : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                          }`}
                        >
                          {/* Left: Page Number, Reorder, Thumbnail, Title */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Page Sequence Badge & Reorder */}
                            <div className="flex flex-col items-center gap-0.5 shrink-0">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                                #{idx + 1}
                              </span>
                              {batchFiles.length > 1 && (
                                <div className="flex gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveBatchItem(idx, "up")}
                                    disabled={idx === 0}
                                    className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move Page Up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveBatchItem(idx, "down")}
                                    disabled={idx === batchFiles.length - 1}
                                    className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move Page Down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                              {item.isImage && item.previewUrl ? (
                                <img
                                  src={item.previewUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-gray-400" />
                              )}
                            </div>

                            {/* Name & Details */}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[280px]" title={item.name}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                                  {(item.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                                {item.exceedsLimit && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
                                    Exceeds {categoryConfig.maxSizeMB} MB
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Center: Per-File Size Reducer Tickmark Option */}
                          <div className="shrink-0 md:w-80">
                            <label
                              className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                item.applySizeReducer
                                  ? "bg-amber-100/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                                  : "bg-gray-100/60 dark:bg-zinc-750 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-gray-300"
                              } ${!item.isImage ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={item.applySizeReducer}
                                onChange={() => toggleItemReducer(item.id)}
                                disabled={!item.isImage}
                                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
                              />
                              <div className="text-xs leading-tight">
                                <div className="font-semibold flex items-center gap-1.5">
                                  <span>Apply Size Reducer</span>
                                  {item.applySizeReducer ? (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold uppercase tracking-wider">
                                      Quality Dulled
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium">
                                      Raw 100% Quality
                                    </span>
                                  )}
                                </div>
                                {item.isImage ? (
                                  item.applySizeReducer ? (
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                                      Reduced: {(item.size / (1024 * 1024)).toFixed(2)} MB → {((item.compressedSize || item.size) / (1024 * 1024)).toFixed(2)} MB
                                      {item.reductionPercent ? ` (-${item.reductionPercent}%)` : ""}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                                      Full raw fidelity preserved. Tick to dull quality if over limit.
                                    </p>
                                  )
                                ) : (
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    Quality reducer is applicable to image / photo scans
                                  </p>
                                )}
                              </div>
                            </label>
                          </div>

                          {/* Right: Delete Page */}
                          <div className="shrink-0 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => removeBatchItem(item.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                              title="Remove page"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add More Pages Drop-Strip */}
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-xs font-semibold text-gray-600 dark:text-zinc-300 cursor-pointer transition-all">
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Click to append more pages or camera snaps to this batch</span>
                    <input
                      id="doc-add-more-pages"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept={categoryConfig.allowedExtensions.join(",")}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{uploadStatusMsg}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUploading || batchFiles.length === 0 || hasOversizedWithoutReducer}
                title={
                  hasOversizedWithoutReducer
                    ? "Tick 'Apply Size Reducer' on oversized page(s) before uploading"
                    : undefined
                }
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to S3...
                  </>
                ) : batchFiles.length <= 1 ? (
                  <>
                    Upload Document to S3 <ArrowRight className="w-4 h-4" />
                  </>
                ) : uploadMode === "merge_pdf" ? (
                  <>
                    <Layers className="w-4 h-4" /> Merge & Upload 1 Layered PDF ({batchFiles.length} Pages)
                  </>
                ) : (
                  <>
                    Upload All {batchFiles.length} Pages to S3 <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Documents Library / Explorer Section */}
        <div className="mt-12 bg-white dark:bg-[#202024] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-4 sm:p-8">
          {/* Header & Quick Text Search Ahead */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{activeTab === "ARCHIVE" ? "Archived Documents Vault" : "Organization Document Vault"}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  {filteredDocuments.length} of {activeTab === "ARCHIVE" ? countArchived : activeDocuments.length}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {activeTab === "ARCHIVE"
                  ? "Archived documents are safely stored in AWS S3 and MongoDB, kept separate from your active workspace."
                  : `Encrypted files stored in your AWS S3 bucket for ${companyName}. Click to generate temporary 60s view links.`}
              </p>
            </div>

            {/* Text Search Ahead */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search titles, files, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs & Archive Tab */}
          <div className="flex flex-wrap items-center gap-2 pt-5 pb-4">
            <button
              onClick={() => handleCategoryFilterChange("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "ALL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
            >
              All Files ({activeDocuments.length})
            </button>
            <button
              onClick={() => handleCategoryFilterChange("PROJECT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "PROJECT"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
            >
              📁 Projects ({countProjects})
            </button>
            <button
              onClick={() => handleCategoryFilterChange("EMPLOYEE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "EMPLOYEE"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
            >
              👤 Employee Records ({countEmployees})
            </button>
            <button
              onClick={() => handleCategoryFilterChange("SALES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "SALES"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
            >
              💼 Sales Pipeline ({countSales})
            </button>
            <button
              onClick={() => handleCategoryFilterChange("SALARY_FINANCE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "SALARY_FINANCE"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
            >
              💰 Salary & Finance ({countFinance})
            </button>

            {/* Dedicated Archive Folder Tab */}
            <button
              onClick={() => handleCategoryFilterChange("ARCHIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto ${activeTab === "ARCHIVE"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/60 dark:border-amber-800/60"
                }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>📦 Archived Files ({countArchived})</span>
            </button>
          </div>

          {/* Three-Branch Cascading Dropdown Filter Toolbar */}
          <div className="bg-gray-50/80 dark:bg-zinc-900/60 p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                Branch-by-Branch Explorer Filter
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <X className="w-3 h-3" /> Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dropdown 1: Category Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  1. Category Filter
                </label>
                <select
                  value={activeTab}
                  onChange={(e) => handleCategoryFilterChange(e.target.value as TabType)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#202024] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Active Files ({activeDocuments.length})</option>
                  <option value="PROJECT">📁 Projects & Deliverables ({countProjects})</option>
                  <option value="EMPLOYEE">👤 Employee Records ({countEmployees})</option>
                  <option value="SALES">💼 Sales Pipeline ({countSales})</option>
                  <option value="SALARY_FINANCE">💰 Salary & Finance ({countFinance})</option>
                  <option value="ARCHIVE">📦 Archived Files ({countArchived})</option>
                </select>
              </div>

              {/* Dropdown 2: Target Entity (Project / Member / Sales Deal / Payroll) */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  2. Target {activeTab === "PROJECT" ? "Project" : activeTab === "EMPLOYEE" ? "Member" : activeTab === "SALES" ? "Deal / Pipeline" : activeTab === "SALARY_FINANCE" ? "Payroll Account" : "Entity"}
                </label>
                <select
                  value={selectedFilterEntity}
                  onChange={(e) => setSelectedFilterEntity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#202024] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {/* Options when activeTab is PROJECT */}
                  {activeTab === "PROJECT" && (
                    <>
                      <option value="ALL">All Projects (Select All)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.name} [{p.category}]
                        </option>
                      ))}
                      <option value="general">📁 General / Unassigned Project Deliverables</option>
                    </>
                  )}

                  {/* Options when activeTab is EMPLOYEE */}
                  {activeTab === "EMPLOYEE" && (
                    <>
                      <option value="ALL">All Members (Select All)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          👤 {u.name} ({u.role}) - {u.email}
                        </option>
                      ))}
                      <option value="general">👤 General Staff Documents</option>
                    </>
                  )}

                  {/* Options when activeTab is SALES */}
                  {activeTab === "SALES" && (
                    <>
                      <option value="ALL">All Deals & Pipeline (Select All)</option>
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          💼 {d.name}
                        </option>
                      ))}
                      <option value="general">💼 General Sales Assets</option>
                    </>
                  )}

                  {/* Options when activeTab is SALARY_FINANCE */}
                  {activeTab === "SALARY_FINANCE" && (
                    <>
                      <option value="ALL">All Payroll & Accounts (Select All)</option>
                      <option value="general">💰 Organization Treasury / Balance Sheet</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          💰 Individual Payslip: {u.name}
                        </option>
                      ))}
                    </>
                  )}

                  {/* Options when activeTab is ALL or ARCHIVE */}
                  {(activeTab === "ALL" || activeTab === "ARCHIVE") && (
                    <>
                      <option value="ALL">All Target Entities (Projects, Staff, Deals)</option>
                      <optgroup label="Projects">
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            📁 {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Staff Directory">
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            👤 {u.name} ({u.role})
                          </option>
                        ))}
                      </optgroup>
                      {deals.length > 0 && (
                        <optgroup label="Deals">
                          {deals.map((d) => (
                            <option key={d.id} value={d.id}>
                              💼 {d.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <option value="general">Organization General Treasury / Unassigned</option>
                    </>
                  )}
                </select>
              </div>

              {/* Dropdown 3: Doc Sub Type */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  3. Doc Sub-Type
                </label>
                <select
                  value={selectedFilterSubtype}
                  onChange={(e) => setSelectedFilterSubtype(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#202024] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Sub-Types (Select All)</option>
                  {availableSubtypes.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Document Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">{entityColumnHeader}</th>
                  <th className="py-3 px-4">Doc Sub Type</th>
                  <th className="py-3 px-4">Original File</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-sm">
                {paginatedDocuments.length > 0 ? (
                  paginatedDocuments.map((doc) => {
                    const sizeMB = (doc.fileSize / (1024 * 1024)).toFixed(2);
                    const isViewing = viewingDocId === doc._id;
                    const isArchiving = isArchivingId === doc._id;

                    return (
                      <tr
                        key={doc._id}
                        className={`transition-colors ${doc.isArchived
                            ? "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20"
                            : "hover:bg-gray-50/70 dark:hover:bg-zinc-800/40"
                          }`}
                      >
                        {/* 1. Document Title */}
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${doc.isArchived
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                  : doc.category === "PROJECT"
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                                    : doc.category === "EMPLOYEE"
                                      ? "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
                                      : doc.category === "SALES"
                                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                }`}
                            >
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate max-w-[240px] flex items-center gap-1.5">
                                <span>{doc.title}</span>
                                {doc.isArchived && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    Archived
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${doc.category === "PROJECT"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : doc.category === "EMPLOYEE"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                                  : doc.category === "SALES"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                          >
                            {doc.category === "PROJECT" && "📁 Project"}
                            {doc.category === "EMPLOYEE" && "👤 Employee"}
                            {doc.category === "SALES" && "💼 Sales"}
                            {doc.category === "SALARY_FINANCE" && "💰 Payroll / Finance"}
                          </span>
                        </td>

                        {/* 3. Target Entity (Project / Member / Sales / Payroll / Adaptive) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-zinc-200">
                            {doc.category === "PROJECT" && (
                              <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                            {doc.category === "EMPLOYEE" && (
                              <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            )}
                            {doc.category === "SALES" && (
                              <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            {doc.category === "SALARY_FINANCE" && (
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[180px]">
                              {doc.entityName || "General / Unassigned"}
                            </span>
                          </div>
                        </td>

                        {/* 4. Doc Sub Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                            {doc.subType || "General Document"}
                          </span>
                        </td>

                        {/* 5. Original File (with 400x300px Hover Peek Preview) */}
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                          <div
                            onMouseEnter={(e) => handleFileMouseEnter(doc, e)}
                            onMouseLeave={handleFileMouseLeave}
                            onClick={() => handleViewDocument(doc._id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100/90 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-gray-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-zinc-700/70 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all shadow-sm group select-none"
                            title="Hover to peek (400x300) or click to open"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                            <span className="truncate max-w-[190px] font-medium">{doc.originalName}</span>
                          </div>
                        </td>

                        {/* 6. Size */}
                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                          {Number(sizeMB) > 0.01 ? `${sizeMB} MB` : `${Math.round(doc.fileSize / 1024)} KB`}
                        </td>

                        {/* 7. Uploaded By */}
                        <td className="py-3.5 px-4 text-xs text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {doc.uploadedByName}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase">
                              {doc.uploadedByRole}
                            </span>
                          </div>
                        </td>

                        {/* 8. Date */}
                        <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(doc.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View / Download (Temporary Presigned S3 link) */}
                            <button
                              onClick={() => handleViewDocument(doc._id)}
                              disabled={isViewing}
                              title="View or download document"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 transition-colors"
                            >
                              {isViewing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" />
                              )}
                              View
                            </button>

                            {/* Safe Archive / Restore Action */}
                            <button
                              onClick={() => handleArchiveToggle(doc._id, Boolean(doc.isArchived), doc.title)}
                              disabled={isArchiving}
                              title={
                                doc.isArchived
                                  ? "Restore back to active working area"
                                  : "Move to Archive folder to keep working area clean"
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${doc.isArchived
                                  ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-400"
                                }`}
                            >
                              {isArchiving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : doc.isArchived ? (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </>
                              ) : (
                                <>
                                  <Archive className="w-3.5 h-3.5" /> Archive
                                </>
                              )}
                            </button>

                            {/* Strict Delete Action (For Managers & Owners Only) */}
                            {isManagerOrOwner && (
                              <button
                                onClick={() => handleOpenDeleteModal(doc)}
                                title="Delete document (strictly asks for Vault vs S3 deletion)"
                                className="p-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors ml-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500 dark:text-zinc-400 text-sm">
                      {activeTab === "ARCHIVE"
                        ? "No archived documents in vault. Use the 'Archive' button on active documents to move them here."
                        : "No active documents found matching this filter criteria. Try resetting the filters or upload a new file above."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-2 border-t border-gray-100 dark:border-zinc-800 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-gray-500 dark:text-zinc-400">
              <span>
                Showing <strong className="text-gray-900 dark:text-white font-semibold">{totalResults === 0 ? 0 : startIndex + 1}</strong> to{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">{endIndex}</strong> of{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">{totalResults}</strong> documents
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200 dark:border-zinc-700">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#202024] text-gray-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50 (Default)</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#202024] text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1;
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && <span className="px-1 text-gray-400">…</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                              safeCurrentPage === page
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#202024] text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 400x300px Floating Hover Peek Modal */}
      {peekState && (
        <div
          onMouseEnter={handlePeekMouseEnter}
          onMouseLeave={handlePeekMouseLeave}
          style={{
            position: "fixed",
            width: 400,
            height: 300,
            top:
              peekState.rect.top > 320
                ? peekState.rect.top - 310
                : Math.min(window.innerHeight - 310, peekState.rect.bottom + 8),
            left: Math.max(
              16,
              Math.min(window.innerWidth - 416, peekState.rect.left - 40)
            ),
            zIndex: 9999,
          }}
          className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-blue-500/40 dark:border-blue-400/40 overflow-hidden flex flex-col ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md select-none"
        >
          {/* Header Bar */}
          <div className="h-10 px-3 bg-gray-50/95 dark:bg-zinc-800/95 border-b border-gray-200 dark:border-zinc-700/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-1 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </span>
              <span
                className="font-semibold text-xs text-gray-900 dark:text-white truncate max-w-[200px]"
                title={peekState.doc.originalName}
              >
                {peekState.doc.originalName}
              </span>
              <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 shrink-0">
                ({Math.round(peekState.doc.fileSize / 1024)} KB)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (peekState.url) {
                  window.open(peekState.url, "_blank", "noopener,noreferrer");
                } else {
                  handleViewDocument(peekState.doc._id);
                }
              }}
              className="px-2.5 py-1 rounded text-xs font-bold bg-[#0078D4] hover:bg-[#106EBE] text-white flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] shrink-0"
              title="Open full document in new tab"
            >
              <span>Open</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Preview Container (fills remaining 400x300 space) */}
          <div className="flex-1 w-full relative overflow-hidden bg-gray-100/70 dark:bg-zinc-900/80 flex items-center justify-center">
            {peekState.isLoading ? (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-zinc-400 text-xs font-medium">
                <RefreshCw className="w-5 h-5 animate-spin text-[#0078D4]" />
                <span>Generating instant preview...</span>
              </div>
            ) : peekState.url ? (
              (() => {
                const mime = (peekState.doc.mimeType || "").toLowerCase();
                const name = peekState.doc.originalName.toLowerCase();
                const isImg =
                  mime.startsWith("image/") ||
                  /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(name);
                const isPdf =
                  mime === "application/pdf" || name.endsWith(".pdf");

                if (isImg) {
                  return (
                    <div
                      className="w-full h-full relative cursor-pointer group flex items-center justify-center p-2.5"
                      onClick={() => window.open(peekState.url!, "_blank", "noopener,noreferrer")}
                      title="Click anywhere to open full image"
                    >
                      <img
                        src={peekState.url}
                        alt={peekState.doc.originalName}
                        className="max-w-full max-h-full object-contain rounded shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                          <ExternalLink className="w-3 h-3" /> Click to Open Full
                        </span>
                      </div>
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <div className="w-full h-full relative group">
                      <iframe
                        src={`${peekState.url}#toolbar=0&navpanes=0&scrollbar=0`}
                        title={peekState.doc.originalName}
                        className="w-full h-full border-0 bg-white"
                      />
                      <div
                        onClick={() => window.open(peekState.url!, "_blank", "noopener,noreferrer")}
                        className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-md bg-black/80 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-sm transition-all"
                        title="Click to open PDF in new tab"
                      >
                        <span>Open Full PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer group"
                    onClick={() => window.open(peekState.url!, "_blank", "noopener,noreferrer")}
                  >
                    <FileText className="w-12 h-12 text-[#0078D4] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-xs text-gray-800 dark:text-zinc-200 truncate max-w-[320px]">
                      {peekState.doc.originalName}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                      {peekState.doc.mimeType || "Binary Document"}
                    </p>
                    <span className="mt-3 px-3.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#0078D4] dark:text-[#479EF5] text-xs font-semibold group-hover:bg-[#0078D4] group-hover:text-white transition-all flex items-center gap-1.5 shadow-sm">
                      <span>Click to Open Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-500 text-xs p-4 text-center">
                <AlertCircle className="w-6 h-6 text-amber-500 mb-1" />
                <span className="font-medium">Direct preview currently unavailable</span>
                <button
                  type="button"
                  onClick={() => handleViewDocument(peekState.doc._id)}
                  className="mt-2.5 px-3 py-1 rounded-md bg-[#0078D4] text-white font-semibold text-xs shadow-sm hover:bg-[#106EBE] transition-colors"
                >
                  Open Document Directly
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strict Delete Confirmation Modal for Managers and Owners */}
      {deleteModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#202024] rounded-2xl border border-red-200 dark:border-red-900/60 shadow-2xl max-w-lg w-full p-6 text-left">
            <div className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Strict Asset Deletion (Manager &amp; Owner)
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                  Target: <span className="font-semibold text-gray-800 dark:text-zinc-200">{deleteModalDoc.title}</span> ({deleteModalDoc.originalName})
                </p>
              </div>
              <button
                onClick={() => setDeleteModalDoc(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Select deletion scope for this enterprise asset:
              </p>

              {/* Scope Option 1: Delete from here only (Vault Only) */}
              <label
                onClick={() => setDeleteScope("vault_only")}
                className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${deleteScope === "vault_only"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500"
                    : "border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteScope === "vault_only"}
                    onChange={() => setDeleteScope("vault_only")}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-blue-500" /> Delete from Vault Only (from here)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        Audit-Safe
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 mt-1">
                      Removes the metadata reference and index from TaskPMS vault. The raw binary file remains safely archived in your AWS S3 bucket (<code className="text-[11px] font-mono">taskflow-pm-storage-prod</code>) for compliance backups.
                    </p>
                  </div>
                </div>
              </label>

              {/* Scope Option 2: Delete from both (Vault + S3) */}
              <label
                onClick={() => setDeleteScope("both")}
                className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${deleteScope === "both"
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-500"
                    : "border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/40"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteScope === "both"}
                    onChange={() => setDeleteScope("both")}
                    className="mt-1 text-red-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" /> Delete from Both (here + AWS S3)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300">
                        Permanent Wipe
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 mt-1">
                      Permanently destroys the metadata in TaskPMS AND permanently wipes the binary file object directly from the AWS S3 bucket. <span className="font-bold text-red-600 dark:text-red-400">Recovery is completely impossible.</span>
                    </p>
                  </div>
                </div>
              </label>

              {/* Strict Two-Step Confirmation Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirmationConfirmed}
                    onChange={(e) => setDeleteConfirmationConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-zinc-300 font-medium">
                    I am an authorized Manager/Owner and confirm I want to permanently execute this deletion for <span className="font-bold text-gray-900 dark:text-white">'{deleteModalDoc.title}'</span>.
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteModalDoc(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={!deleteConfirmationConfirmed || isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm &amp; Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
