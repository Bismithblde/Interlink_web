export const formatInstagramHandle = (handle?: string) => {
  if (!handle) return null;
  const trimmed = handle.trim().replace(/^@+/, "");
  return trimmed.length > 0 ? trimmed : null;
};


