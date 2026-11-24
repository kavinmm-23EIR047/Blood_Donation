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
