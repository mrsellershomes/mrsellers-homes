// The canonical Tyler Sellers JSON-LD entity, shared by every generated
// page so search engines and LLMs see one consistent agent identity
// (same @id everywhere). sameAs links tie the site to Tyler's other
// surfaces for entity resolution.

export const TYLER_AGENT = {
  '@type': 'RealEstateAgent',
  '@id': 'https://mrsellers.homes/#agent',
  name: 'Tyler Sellers',
  description: 'Bergen County, NJ realtor who reads the economy',
  url: 'https://mrsellers.homes',
  email: 'tyler@mrsellers.homes',
  telephone: '+1-201-308-0525',
  areaServed: { '@type': 'AdministrativeArea', name: 'Bergen County, NJ' },
  sameAs: [
    'https://www.youtube.com/@bergencountyrealestate',
    'https://www.instagram.com/tsellnj',
    'https://www.tiktok.com/@tsellnj'
  ],
  worksFor: {
    '@type': 'LocalBusiness',
    name: 'RE/MAX',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'NJ',
      addressLocality: 'Tenafly',
      addressCountry: 'US'
    }
  }
};
