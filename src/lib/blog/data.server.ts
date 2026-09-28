import "server-only";

import { read } from "@/lib/api/gateway.server";
import { blogPostListSchema, blogPostSchema } from "@/lib/api/schemas";

export function loadBlogPosts() {
  return read("blogPosts", { schema: blogPostListSchema });
}

export function loadBlogPost(id: string) {
  return read("blogPost", { schema: blogPostSchema, params: { id } });
}
