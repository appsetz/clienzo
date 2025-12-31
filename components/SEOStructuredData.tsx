"use client";

export default function SEOStructuredData() {
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Clienzo",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "description": "Clienzo is the ultimate client management tool for freelancers and agencies. Manage clients, projects, payments, and deadlines all in one place.",
    "url": "https://clienzo.com",
    "logo": "https://clienzo.com/images/logo-symbol.png",
    "screenshot": "https://clienzo.com/images/logo-symbol.png",
    "featureList": [
      "Client Management",
      "Project Tracking",
      "Payment Management",
      "Deadline Reminders",
      "Revenue Analytics",
      "Export Data"
    ]
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Clienzo",
    "url": "https://clienzo.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://clienzo.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Clienzo",
    "url": "https://clienzo.com",
    "logo": "https://clienzo.com/images/logo-symbol.png",
    "sameAs": [
      "https://www.instagram.com/appsetz"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}

