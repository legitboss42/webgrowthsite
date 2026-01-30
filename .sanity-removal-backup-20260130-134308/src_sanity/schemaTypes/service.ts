import { defineField, defineType } from "sanity";

export default defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Service Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "short",
      title: "Short Summary",
      type: "string",
      validation: (Rule) => Rule.required().max(160),
    }),

    defineField({
      name: "bullets",
      title: "Bullets",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.max(6),
    }),

    defineField({
      name: "image",
      title: "Card Image",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Lower number shows first",
      initialValue: 10,
    }),
  ],

  orderings: [
    {
      title: "Order (asc)",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});