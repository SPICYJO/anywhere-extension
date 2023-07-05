/**
 * Returns human friendly time since string.
 * ex) getTimeSinceString("2023-07-04T07:15:16.770Z" , "2023-07-05T07:15:16.770Z") would return "1 day ago"
 * @param {*} timestamp1
 * @param {*} timestamp2
 * @returns
 */
export function getTimeSinceString(timestamp1, timestamp2) {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const timeDiff = Math.abs(date1 - date2);
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
  }
}
