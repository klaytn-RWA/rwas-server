export function randomString() {
  var result = "";
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var i = 32; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result.slice(0, 7);
}
