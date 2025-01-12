module.exports = {
  reactStrictMode: true,
  images: {
    domains: ["tailwindui.com"],
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
};
