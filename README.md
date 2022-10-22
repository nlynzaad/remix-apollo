This repo is a proof of concept of using Apollo Client with Remix. It uses Apollo's recommended set up for SSR. This allows you to take advantage of Apollo Client's hooks and caching while still having requests done on the server.

Using it this manner will probably result in loosing out on a lot of the optimisations that remix does under the hood, like prefetching.

