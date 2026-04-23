import { v4 as uuid } from "uuid";

const isTauri = () => typeof window !== "undefined" && "__TAURI__" in window;

const isAbsolutePath = (p: string) =>
  /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith("\\\\") || p.startsWith("/");

const toFileUrl = (absolutePath: string) => {
  if (absolutePath.startsWith("\\\\")) {
    const withoutPrefix = absolutePath.replace(/^\\\\+/, "");
    return `file://${withoutPrefix.replace(/\\/g, "/")}`;
  }
  if (/^[a-zA-Z]:[\\/]/.test(absolutePath)) {
    const withSlashes = absolutePath.replace(/\\/g, "/");
    return `file:///${withSlashes}`;
  }
  if (absolutePath.startsWith("/")) return `file://${absolutePath}`;
  return absolutePath;
};

const sanitizeFileName = (name: string) =>
  name.replace(/[^\w.\- ()\[\]]+/g, "_").replace(/\s+/g, " ").trim();

export type StoredLocalFile = {
  storedPath: string; // relative to AppData (preferred) or absolute
  originalName: string;
};

export async function pickAndStoreLocalFile(subdir: "exams" | "resources"): Promise<StoredLocalFile | null> {
  if (!isTauri()) throw new Error("File upload is only available in the desktop app.");

  const [{ open }, { copyFile, createDir, BaseDirectory }, { basename }] = await Promise.all([
    import("@tauri-apps/api/dialog"),
    import("@tauri-apps/api/fs"),
    import("@tauri-apps/api/path"),
  ]);

  const selected = await open({
    multiple: false,
    directory: false,
    title: "Select file",
  });

  if (!selected) return null;

  const sourcePath = Array.isArray(selected) ? selected[0] : selected;
  const originalName = await basename(sourcePath);
  const storedName = `${Date.now()}-${uuid()}-${sanitizeFileName(originalName)}`;
  const storedPath = `uploads/${subdir}/${storedName}`;

  await createDir(`uploads/${subdir}`, { dir: BaseDirectory.AppData, recursive: true });
  await copyFile(sourcePath, storedPath, { dir: BaseDirectory.AppData });

  return { storedPath, originalName };
}

export async function openLocalFile(pathOrStoredPath: string): Promise<void> {
  if (!isTauri()) throw new Error("Opening local files is only available in the desktop app.");

  const [{ open }, { appDataDir, join }] = await Promise.all([
    import("@tauri-apps/api/shell"),
    import("@tauri-apps/api/path"),
  ]);

  const pathToOpen = isAbsolutePath(pathOrStoredPath)
    ? pathOrStoredPath
    : await join(await appDataDir(), pathOrStoredPath);

  const fileUrl = toFileUrl(pathToOpen);
  try {
    await open(fileUrl);
  } catch {
    await open(pathToOpen);
  }
}

export async function removeManagedLocalFile(storedPath: string | undefined): Promise<void> {
  if (!storedPath || !isTauri()) return;

  const { removeFile, BaseDirectory } = await import("@tauri-apps/api/fs");

  if (!isAbsolutePath(storedPath)) {
    if (storedPath.startsWith("uploads/")) {
      await removeFile(storedPath, { dir: BaseDirectory.AppData });
    }
    return;
  }

  const { appDataDir } = await import("@tauri-apps/api/path");
  const root = await appDataDir();
  if (storedPath.startsWith(root)) {
    await removeFile(storedPath);
  }
}
