# zamanadil.com

Faculty site for Dr. Adil Zaman, political scientist at the University of Gujrat. The public site, publication archive, writing, contact form and private desk run as a MERN application: MongoDB, Express, React and Node.

For a fuller description of what the site is and how the system works, see [SYSTEM.md](SYSTEM.md).

## Run

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

The site opens at http://localhost:5173. The API listens on http://localhost:5000.

If `MONGO_URI` is not set and MongoDB is not running locally, the API starts a development MongoDB and loads the publication and article archive. Set `server/.env` from `server/.env.example` to use your own database.

## Archive desk

Sign in at http://localhost:5173/admin/login.

Default username and password. The first sign-in asks for a new password before the desk opens:

- `admin`
- `AdilZaman-Admin-2026`

## Publications

Each publication title opens the journal, DOI or full text that was checked against the publisher. Links can be edited from the archive desk.
