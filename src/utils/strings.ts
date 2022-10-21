export const capitalize = (text: string, separator = ' ') => {
  return text
    .toLowerCase()
    .split(separator)
    .map(word => word.charAt(0).toUpperCase() + word.substring(1))
    .join(separator);
};
