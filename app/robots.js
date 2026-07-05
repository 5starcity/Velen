// app/robots.js
export default function robots() {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/api/",
          "/login",
          "/signup",
        ],
      },
      sitemap: "https://rezidence.ng/sitemap.xml",
    };
  }