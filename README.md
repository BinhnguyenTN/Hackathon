# Closet AI — Clothing Scanner Sub-site

A standalone front-end prototype for a digital closet. It supports:

- Image upload / drag-and-drop
- Mobile camera capture
- An extraction-processing UI
- Review + edit before saving
- Category/color/season metadata
- LocalStorage persistence
- Closet filtering and item deletion
- Responsive desktop/mobile layout

## Run

No build step is required.

```bash
python3 -m http.server 8080
```

Then open:

http://localhost:8080

Camera access normally requires `localhost` or HTTPS.

## Real AI extraction

The current `processImage()` function deliberately keeps the prototype dependency-free: it presents an extraction workflow and stores the captured image.

For production, replace that function with a call to your image-segmentation backend:

```js
const result = await fetch("/api/extract", {
  method: "POST",
  body: formData
});
const { cutoutUrl, category, color, name } = await result.json();
```

The backend can use a segmentation/background-removal model (for example, a hosted vision API or your own model) to return a transparent PNG plus detected clothing attributes.

Recommended production pipeline:

1. Capture/upload image.
2. Detect the garment/person region.
3. Segment the garment from the background.
4. Return transparent PNG / mask.
5. Classify garment type, color, material and season.
6. Show the user a review screen.
7. Save the final item and metadata to a database/object store.

The UI is intentionally separated from this API so the AI provider can be swapped without redesigning the closet.
