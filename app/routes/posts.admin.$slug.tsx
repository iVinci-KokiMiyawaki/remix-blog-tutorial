import type { ActionArgs, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { createPost, deletePost, getPost, updatePost } from "~/models/post.server";

export const loader: LoaderFunction =async ({ request, params }) => {
  invariant(params.slug, "params.slug is required");
  if (params.slug === 'new') {
    return json({});
  }
  const post = await getPost(params.slug)
  return json({ post })
}

export const action = async ({ request, params }: ActionArgs) => {
  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));
  const formData = await request.formData();
  const intent = formData.get('intent')

  if (intent === 'delete') {
    await deletePost(params.slug);
    return redirect("/posts/admin")
  }

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );
  if (hasErrors) {
    return json(errors);
  }

  invariant(
    typeof title === "string",
    "title must be a string"
  );
  invariant(
    typeof slug === "string",
    "slug must be a string"
  );
  invariant(
    typeof markdown === "string",
    "markdown must be a string"
  );

  if (params.slug === 'new') {
    await createPost({ title, slug, markdown })
  } else {
    await updatePost(params.slug as string, { title, slug, markdown })
  }

  return redirect("/posts/admin");
};

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export default function NewPost() {
  const data = useLoaderData();
  const errors = useActionData<typeof action>();
  const navigation = useNavigation();
  const isCreating = navigation.formData?.get('intent') === 'create';
  const isUpdating = navigation.formData?.get('intent') === 'update';
  const isDeleting = navigation.formData?.get('intent') === 'delete';
  const isNewPost = !data.post;

  return (
    <Form method="post" key={data.post?.slug ?? 'new'}>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={data.post?.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={data.post?.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">
              {errors.markdown}
            </em>
          ) : null}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={data.post?.markdown}
        />
      </p>
      <p className="text-right">
        {isNewPost ? null :
          <button
            type="submit"
            name="intent"
            value='delete'
            className="rounded bg-red-500 py-2 px-4 mr-2 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        }
        <button
          type="submit"
          name="intent"
          value={isNewPost ? 'create' : 'update'}
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isCreating || isUpdating}
        >
          {isNewPost ? (isCreating ? "Creating..." : "Create Post") : null }
          {isNewPost ? null : isUpdating ? 'Updating...' : 'Update'}
        </button>

      </p>
    </Form>
  );
}