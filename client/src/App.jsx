import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Chrome";
import Home from "./pages/Home";

const Admin = lazy(() => import("./pages/Admin"));
const loadPublications = () => import("./pages/Publications");
const Publications = lazy(() => loadPublications().then((mod) => ({ default: mod.default })));
const PublicationPage = lazy(() => loadPublications().then((mod) => ({ default: mod.PublicationPage })));
const loadWriting = () => import("./pages/Writing");
const Archive = lazy(() => loadWriting().then((mod) => ({ default: mod.Archive })));
const ArticlePage = lazy(() => loadWriting().then((mod) => ({ default: mod.ArticlePage })));
const loadPages = () => import("./pages/Pages");
const About = lazy(() => loadPages().then((mod) => ({ default: mod.About })));
const Expertise = lazy(() => loadPages().then((mod) => ({ default: mod.Expertise })));
const Services = lazy(() => loadPages().then((mod) => ({ default: mod.Services })));
const Contact = lazy(() => loadPages().then((mod) => ({ default: mod.Contact })));
const SearchPage = lazy(() => loadPages().then((mod) => ({ default: mod.SearchPage })));
const Legal = lazy(() => loadPages().then((mod) => ({ default: mod.Legal })));
const NotFound = lazy(() => loadPages().then((mod) => ({ default: mod.NotFound })));

function Pending() {
  return <div className="page-pending" aria-hidden="true" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<Pending />}><Admin /></Suspense>} />
      <Route path="*" element={
        <Layout>
          <Suspense fallback={<Pending />}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="expertise" element={<Expertise />} />
              <Route path="publications" element={<Publications />} />
              <Route path="publications/:slug" element={<PublicationPage />} />
              <Route path="research-reviews" element={<Archive kind="review" />} />
              <Route path="research-reviews/:slug" element={<ArticlePage kind="review" />} />
              <Route path="opinion-blogs" element={<Archive kind="opinion" />} />
              <Route path="opinion-blogs/:slug" element={<ArticlePage kind="opinion" />} />
              <Route path="services" element={<Services />} />
              <Route path="contact" element={<Contact />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="privacy" element={<Legal kind="privacy" />} />
              <Route path="disclaimer" element={<Legal kind="disclaimer" />} />
              <Route path="accessibility" element={<Legal kind="accessibility" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      } />
    </Routes>
  );
}
