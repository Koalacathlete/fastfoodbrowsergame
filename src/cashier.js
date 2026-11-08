// The physical register uses dollar entry: 1, 2, '.', 5 means $12.50.
export function pressKey(value, key) {
  if (key === "clear") return "";
  if (key === "backspace") return value.slice(0, -1);
  let next = value;
  for (const char of key) {
    if (char === "." && !next) next = "0";
    const candidate = next === "0" && char !== "." ? char : next + char;
    if (/^\d{0,5}(\.\d{0,2})?$/.test(candidate)) next = candidate;
  }
  return next;
}
