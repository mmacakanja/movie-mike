# Movie Mike — Version 6.4

Version 6.4 is a small visual and UX refinement of Version 6.3.

## Changes

- The Telluride Main Street image is now rendered as a real `<img>` layer behind the festival content instead of relying only on `background-image`. This is more robust with the current Vercel deployment setup.
- The dark overlay has been reduced so the photograph is clearly visible while text remains readable.
- Removed the technical “critic pipeline” caption below Metacritic.
- Removed the redundant “View Mike’s ratings” button.
- Clicking anywhere on a Telluride movie card opens the normal Movie Mike detail/ratings dialog.

All Version 6.3 API routing, metadata, comments, Google Sheet, critic-score, and V5/V6 features are preserved.
