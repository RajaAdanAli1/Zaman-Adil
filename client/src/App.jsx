import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Chrome";
import Home from "./pages/Home";
import Publications, { PublicationPage } from "./pages/Publications";
import { Archive, ArticlePage } from "./pages/Writing";
import { About, Contact, Expertise, Legal, NotFound, SearchPage, Services } from "./pages/Pages";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="*" element={
        <Layout>
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
        </Layout>
      } />
    </Routes>
  );
}
