export const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    const safeIndex = Math.min(
        index,
        units.length - 1
    );

    const size =
        bytes / Math.pow(1024, safeIndex);

    return `${size.toFixed(
        safeIndex === 0 ? 0 : 2
    )} ${units[safeIndex]}`;
};