# ZXHUEN Garage

Premium, responsive single-page automotive showroom built with Tailwind CSS 4, inline SVG icons, and dependency-free browser JavaScript.

## Open the page

Run `npm run dev` from the repository root and visit `/site/zxhuenGarage`.

The Next.js route serves a complete HTML document directly. It does not hydrate React, load a Tailwind CDN, or depend on third-party scripts. Sign-in links point to `/Login?next=%2Fsite%2FzxhuenGarage`.

## Edit and rebuild

- `build.mjs`: page markup, sample vehicle data, contact details, reviews, and Tailwind utility classes.
- `premium.css`: custom effects, reduced-motion support, form styling, and interaction states.
- `interactions.js`: navigation, reveal effects, counters, filters, sorting, detail dialogs, and inquiry previews.
- `index.html`: generated standalone document with compiled Tailwind styles and inline JavaScript.
- `document.generated.json`: generated copy imported by `app/site/zxhuenGarage/route.ts`, so production builds include the document without runtime filesystem reads.

Run `npm run build:garage` after editing the source. `npm run build` rebuilds this HTML automatically before the Next.js production build. The standalone HTML expects images at `/site/zxhuenGarage/`; copy `public/site/zxhuenGarage` to that path when deploying it outside Next.js. A standalone host must also provide the `/Login` destination or update the sign-in links.

## Included interactions

Responsive navigation with accessible mobile toggle, in-page navigation, scroll reveals, animated collection counters, body-style filters, ascending/descending price sorting, native vehicle detail dialogs, inquiry prefill, validated local-only form preview, and social placeholder information. Motion respects the visitor’s reduced-motion preference. All content is readable without JavaScript.

## Demo content and contact behavior

Vehicle prices/specifications use the supplied sample data. Photos are illustrative stock images and may show different years or trims. Testimonials, names, address, phone, hours, and social profiles are sample content and are labeled accordingly.

As requested, the contact form does **not** send email or network requests and does not save data. It validates the fields and opens a local preview. Input is rendered as text, never interpreted as HTML. The `.example` email address is display-only. Social icons show placeholder information until real profile URLs are available.

Replace sample claims and vehicle details with verified business information before using the showroom for live sales.

## Image sources

Locally stored in `public/site/zxhuenGarage`:

- Porsche: Unsplash `photo-1503376780353-7e6692767b70`.
- BMW M4: [Unsplash BMW M4 Competition collection](https://unsplash.com/s/photos/bmw-m4-competition), photo `1681856848600-0de0515eb9fb`.
- Mercedes AMG: Unsplash `photo-1618843479313-40f8afb4b4d8`.
- Lamborghini hero and listing: Unsplash `photo-1544829099-b9a0c07fad1a`.
