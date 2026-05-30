import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";


// ----- Home Page -----

const goals = [
  { title: "Open by Default", desc: "No paywalls, no fees, and no artificial barriers to scientific knowledge.", icon: "🔓" },
  { title: "Built by Community", desc: "Transparent, open-source collaboration with expert review at the center.", icon: "🌍" },
  { title: "Global and Multilingual", desc: "Resources designed for students, educators, and researchers across languages and regions.", icon: "🌐" },
];

const projects = [
  { title: "General Chemistry", url: "https://openscienceteam.github.io/General-Chemistry/", img: "/OpenScience/images/books/General-Chemistry.png" },
  { title: "Generative Models for Materials Science", url: "https://openscienceteam.github.io/aiforscience/", img: "/OpenScience/images/books/aiforscience.png" },
  { title: "Electrochemical", url: "https://openscienceteam.github.io/electrochemistry/", img: "/OpenScience/images/books/Electrochemical.png" },
];

const orgLogos = ["sustech.png", "Berkeley.png", "Berkeley2.png", "bids.png", "jupyter.png"];

export function HomePage() {
  const { t } = useTranslation();
  return (
    <div>
      {/* Hero: split-image layout */}
      <section className="home-hero" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4rem", padding: "6rem 3rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ flex: "1 1 50%" }}>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4" style={{ fontSize: "2.25rem", lineHeight: 1.2 }}>{t("hero.welcome")}</h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">{t("hero.subtitle")}</p>
          <Link to="/intro" style={{ display: "inline-block", padding: "0.75rem 2rem", backgroundColor: "#013243", color: "#fff", fontWeight: 600, borderRadius: "0.5rem", textDecoration: "none" }}>{t("hero.getStarted")}</Link>
        </div>
        <div style={{ flex: "1 1 50%", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
          <img src="/OpenScience/images/brain.png" alt="Open Science Brain" style={{ width: "100%", maxWidth: "500px", height: "auto", objectFit: "contain" }} />
        </div>
      </section>

      {/* About: 2-column grid */}
      <section className="bg-gray-50 py-20 px-6">
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
          <p className="text-gray-700 leading-relaxed text-lg">
            We are building an open-science knowledge initiative at UC Berkeley BIDMaP. Our vision is a multilingual
            open knowledge infrastructure for STEM learning in the AI and LLM era.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img src="/OpenScience/images/earth.png" alt="Earth" style={{ width: "16rem", height: "auto", objectFit: "contain" }} />
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="py-20 px-6" style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Goals</h2>
        <p className="text-gray-500 mb-12" style={{ maxWidth: "640px", margin: "0 auto 3rem" }}>
          Open Science is a public knowledge commons for the AI era: free to access, easy to improve, and built for learners everywhere.
        </p>
        <div className="home-goals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginTop: "1.5rem", marginBottom: "1.5rem" }}>
          {goals.map((g) => (
            <div key={g.title} className="sd-card" style={{ height: "100%", border: "1px solid rgba(1,50,67,0.12)", borderRadius: "1rem", boxShadow: "0 0.75rem 2rem rgba(1,50,67,0.08)", padding: "2rem", textAlign: "left" }}>
              <span className="text-3xl mb-4 block">{g.icon}</span>
              <h3 className="sd-card-title" style={{ color: "#013243", fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.75rem" }}>{g.title}</h3>
              <p className="text-gray-600 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500 mt-10 italic">Contribute knowledge, tools, and review. Build for science.</p>
      </section>

      {/* Projects */}
      <section className="bg-gray-50 py-20 px-6">
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Projects</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
            {projects.map((p) => (
              <a key={p.title} href={p.url} target="_blank" rel="noopener noreferrer"
                 className="sd-card" style={{ display: "block", border: "1px solid rgba(1,50,67,0.12)", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 0.75rem 2rem rgba(1,50,67,0.08)", textDecoration: "none", color: "inherit", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "8rem", marginBottom: "1rem" }}>
                  <img src={p.img} alt={p.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#4b5563", fontWeight: 500 }}>{p.title}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="py-20 px-6" style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
        <h3 className="text-lg font-semibold text-gray-700 mb-10">Our Supporters and Initiative Collaborators</h3>
        <div className="org-logo-cloud" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1.25rem", justifyContent: "center", alignItems: "center" }}>
          {orgLogos.map((logo) => (
            <figure key={logo} style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: 0, flex: "0 1 auto" }}>
              <img src={`/OpenScience/images/org/${logo}`} alt={logo.replace(/\.[^.]+$/, "")}
                   style={{ display: "block", maxHeight: "4.5rem", maxWidth: "10.5rem", width: "auto", height: "auto", objectFit: "contain", objectPosition: "center" }} />
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}

// ----- About Page -----

const committee = [
  { name: "Boyu Qie", role: "Chemistry/Physics/AI", org: "UC Berkeley", img: "BoyuQie.png" },
  { name: "Nakul Rampal", role: "Chemistry/AI", org: "UC Berkeley", img: "NakulRampal.png" },
  { name: "Zihui Zhou", role: "Chemistry", org: "UC Berkeley", img: "ZihuiZhou.png" },
  { name: "Xin Wang", role: "Chemistry", org: "UC Berkeley", img: "XinWang.png" },
  { name: "Ziyi Wang", role: "Chemistry/Physics", org: "UC Berkeley", img: "ZiyiWang.png" },
  { name: "Rafal Zuzak", role: "Physics", org: "UC Berkeley", img: "RafalZuzak.png" },
  { name: "Ping Tuo", role: "Materials/AI", org: "UC Berkeley", img: "PingTuo.png" },
  { name: "Eric Qu", role: "CS/AI", org: "UC Berkeley", img: "EricQu.png" },
  { name: "Benkai Li", role: "", org: "", img: "BenkaiLi.webp" },
];

const techBoard = [
  { name: "Boyu Qie", role: "Chemistry/Physics/AI", org: "UC Berkeley", img: "BoyuQie.png" },
  { name: "Benkai Li", role: "", org: "", img: "BenkaiLi.webp" },
];

const orgLogosAbout = ["Berkeley.png", "sustech.png", "jupyter-book.webp", "jupyter.png", "Berkeley2.png", "bids.png"];

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-12">About</h1>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Team</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-6">Contributor/Committee</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {committee.map((p) => (
            <div key={p.name} className="text-center">
              <img src={`/OpenScience/images/team/${p.img}`} alt={p.name}
                   className="w-32 h-32 object-cover rounded-full mx-auto mb-3" />
              <div className="font-semibold text-sm">{p.name}</div>
              {p.role && <div className="text-xs text-gray-500">{p.role}</div>}
              {p.org && <div className="text-xs text-gray-400">{p.org}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h3 className="text-lg font-semibold text-gray-700 mb-6">Scientific Advisory Board</h3>
        <p className="text-gray-500 italic">Coming soon...</p>
      </section>

      <section className="mb-16">
        <h3 className="text-lg font-semibold text-gray-700 mb-6">Tech Board</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {techBoard.map((p) => (
            <div key={p.name} className="text-center">
              <img src={`/OpenScience/images/team/${p.img}`} alt={p.name}
                   className="w-32 h-32 object-cover rounded-full mx-auto mb-3" />
              <div className="font-semibold text-sm">{p.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-8">Supporting/Collaborating Organizations</h3>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {orgLogosAbout.map((logo) => (
            <img key={logo} src={`/OpenScience/images/org/${logo}`} alt={logo.replace(/\.[^.]+$/, "")}
                 className="h-16 w-auto object-contain" />
          ))}
        </div>
      </section>
    </div>
  );
}
