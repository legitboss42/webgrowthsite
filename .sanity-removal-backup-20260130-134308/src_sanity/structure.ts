import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.documentTypeListItem("page").title("Pages"),
      S.documentTypeListItem("service").title("Services"),
      S.documentTypeListItem("project").title("Projects"),
    ]);