# Poongurichi Nanbargal Blood Network

A Next.js App Router public website, Node.js/Express API, and MongoDB CRM for Poongurichi Nanbargal Donor’s Club. The public donor directory starts empty because the source site only exposes aggregate counts; members can add themselves and explicitly opt in to share their contact details.

## Run locally

1. Install Node.js 20.9 or newer and MongoDB Community Server, or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env`, set `MONGODB_URI` to your MongoDB connection string, and choose a private `ADMIN_PASSCODE` for CRM access.
3. Install packages with `npm install`.
4. Start the Next.js frontend and Node.js API with `npm run dev`.
5. Open the frontend URL printed in the terminal. It uses port 3000 when free, and automatically chooses another free port if another app copy is already running.

The API reports the MongoDB connection state in the dashboard header. Donor, request, event, and homepage content writes require MongoDB and are not silently saved to browser storage. The coordinator passcode protects CRM data with an eight-hour signed session token. The Next.js server proxies `/api/*` to the Node API at `API_ORIGIN`.

To inspect the API directly, open the **Backend API** URL printed by `npm run dev`. Its base page lists each endpoint by purpose and access level; append `/api` to see the JSON endpoint catalog, or open `/api/health` to check the database connection.

## MongoDB collections

- `donors`: name, phone, blood group, area, donor availability and optional last donation date
- `bloodrequests`: patient/reference, blood group, units, hospital, contact, urgency and workflow status
- `events`: title, date, location, description and planning status
- `homepagecontents`: editable bilingual homepage text, section visibility, community totals, donor group totals, images, club contacts and social links

The Next.js UI lives in `frontend/src/app`, with its images in `frontend/public`. The Node.js API entry point is `backend/server.js`, with database models in `backend/models.js`. It serves `GET /api/health`, `GET /api/dashboard`, list/create endpoints under `/api/donors`, `/api/requests`, and `/api/events`, and opt-in public donor listing plus private blood request submission under `/api/public/*`. `GET /api/public/homepage` supplies the public page from MongoDB, while the authenticated CRM editor reads and updates `/api/homepage/content`. Donors and requests also support `PATCH /:id` for CRM updates. Public donor search returns only records with `publicListing: true`; request details remain in the signed-in CRM.

## Source content and imagery

Original site content and available images were collected from [Poongurichi Nanbargal Blood Donors Club](https://poongurichinanbargal.github.io/blood-donationapp/). Contact details and public social links appear under About and Community. The source’s aggregate directory shows 33 donors: A+ 4, A− 1, B+ 7, B− 0, AB+ 2, AB− 1, O+ 18 and O− 0. It reports 5 blood requests and 0 camps/events. Detailed member records are not public on the source page, so the CRM does not invent them.

Homepage text, section visibility, images, contacts, and social links are read from the `HomepageContent` MongoDB document and edited through the CRM’s **Homepage content** page. The API no longer serves bundled homepage copy when MongoDB is disconnected or when the homepage document is missing. Donor counts and group totals are calculated from MongoDB donor records, and the donor section shows public listings only for members who opted in.

The public page includes a bilingual Quick Access section. Become a Donor, Find Blood, Request Blood, and Camps & Events each open their own public page, where visitors can submit opt-in donor details or a blood request and browse public donor, request, and event records. Admin record editing remains protected by the coordinator passcode at `/admin`.

Upcoming events are read from MongoDB and published when their CRM status is `Upcoming` and their date is current or future.

## Deploying to Vercel with MongoDB

The Vercel frontend and Express/MongoDB API are separate services. Vercel does not start `backend/server.js` when it builds the Next.js app. Deploy the API first from this repository using the included `render.yaml` Blueprint, then add these environment variables to the API service:

- `MONGODB_URI`: your MongoDB Atlas connection string. In Atlas, allow connections from the API host (for Render, use `0.0.0.0/0` in Network Access if you need a stable allow-list-free setup; protect the database with a strong database user and password).
- `ADMIN_PASSCODE`: your private CRM passcode.
- `CLIENT_ORIGIN`: the public Vercel site URL. The Blueprint is prefilled with `https://blood-donation-ten-delta.vercel.app`; update it if your domain differs. Multiple exact origins can be comma-separated.

After the API is live, open its `/api/health` URL and confirm `database` is `connected`. In the Vercel project, set `API_ORIGIN` to the API's full public origin, such as `https://poongurichi-blood-network-api.onrender.com` (no `/api` suffix), for Production and Preview as needed. Set the Vercel project's Root Directory to `frontend`, keep Install Command as `npm install`, and Build Command as `npm run build`. Redeploy after saving the environment variable. A production build now fails with a clear configuration message if `API_ORIGIN` is missing instead of silently publishing a page that cannot load its content.

Once both services are deployed, check `https://your-site/api/health` through the Vercel domain and confirm `database` is `connected`; then open the public homepage and `/admin`.
