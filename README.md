# Movie Mike — Version 6.5

Version 6.5 fixes the remaining Telluride background-image problem by embedding Mike's Telluride photo directly in `index.html`. The browser no longer needs to request a separate JPEG URL, so the photo will load whenever the page itself loads.

All Version 6.4 functionality is preserved, including live metadata, Metacritic, Telluride card click-through to the regular ratings dialog, comments, Google Sheet integration, and API routing.

The original `telluride-main-street.jpg` remains in the package for reference, but Vercel does not need to serve it for the page to display the image.
