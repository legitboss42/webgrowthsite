export function detectAddedBlogPaths(nameStatusOutput: string) {
  return nameStatusOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t"))
    .filter(([status]) => status === "A")
    .map(([, file]) => file || "")
    .filter((file) => /^content\/blog\/[^/]+\.md$/i.test(file))
    .filter((file) => !file.split("/").pop()?.startsWith("_"))
    .filter((file) => !file.endsWith("-image-prompts.md"));
}
