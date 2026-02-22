// utils/diffChecker.js
export const findDifferences = (oldData, newData, path = "") => {
  let changes = [];

  for (const key in newData) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof newData[key] === "object" && newData[key] !== null) {
      changes = changes.concat(
        findDifferences(oldData?.[key] || {}, newData[key], currentPath)
      );
    } else {
      if (oldData?.[key] !== newData[key]) {
        changes.push({
          field: currentPath,
          oldValue: oldData?.[key],
          newValue: newData[key]
        });
      }
    }
  }

  return changes;
};