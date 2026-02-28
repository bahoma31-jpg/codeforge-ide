if (!self.define) {
  let e,
    s = {};
  const c = (c, a) => (
    (c = new URL(c + '.js', a).href),
    s[c] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = c), (e.onload = s), document.head.appendChild(e));
        } else ((e = c), importScripts(c), s());
      }).then(() => {
        let e = s[c];
        if (!e) throw new Error(`Module ${c} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, t) => {
    const i =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[i]) return;
    let n = {};
    const r = (e) => c(e, i),
      d = { module: { uri: i }, exports: n, require: r };
    s[i] = Promise.all(a.map((e) => d[e] || r(e))).then((e) => (t(...e), n));
  };
}
define(['./workbox-c05e7c83'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: 'd0003c0a323d315ba264571dbd1e55e6',
        },
        {
          url: '/_next/static/ZI4kxFNYcGl2yLSyB0o-h/_buildManifest.js',
          revision: 'd8e4352ac68faf07f84814c37edb9b11',
        },
        {
          url: '/_next/static/ZI4kxFNYcGl2yLSyB0o-h/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1008.db76c0439673b5b5.js',
          revision: 'db76c0439673b5b5',
        },
        {
          url: '/_next/static/chunks/1044.4f9862ce5ac8014a.js',
          revision: '4f9862ce5ac8014a',
        },
        {
          url: '/_next/static/chunks/1087.31adfd16ad5cf4b4.js',
          revision: '31adfd16ad5cf4b4',
        },
        {
          url: '/_next/static/chunks/1146.205f7f076ef42578.js',
          revision: '205f7f076ef42578',
        },
        {
          url: '/_next/static/chunks/1361.b3d281e3bc244dfb.js',
          revision: 'b3d281e3bc244dfb',
        },
        {
          url: '/_next/static/chunks/1396.fe82ba0ebcb8113a.js',
          revision: 'fe82ba0ebcb8113a',
        },
        {
          url: '/_next/static/chunks/15.822e04b78f5f49ca.js',
          revision: '822e04b78f5f49ca',
        },
        {
          url: '/_next/static/chunks/1568.6b6f4c776bcffe69.js',
          revision: '6b6f4c776bcffe69',
        },
        {
          url: '/_next/static/chunks/1734.b5c52a5d7493a545.js',
          revision: 'b5c52a5d7493a545',
        },
        {
          url: '/_next/static/chunks/1804.5f95d2c1cc35c9de.js',
          revision: '5f95d2c1cc35c9de',
        },
        {
          url: '/_next/static/chunks/1866.571046be5e41e399.js',
          revision: '571046be5e41e399',
        },
        {
          url: '/_next/static/chunks/1887.8bbdc98ecbec9ae0.js',
          revision: '8bbdc98ecbec9ae0',
        },
        {
          url: '/_next/static/chunks/1965.414fe73cd821b7cb.js',
          revision: '414fe73cd821b7cb',
        },
        {
          url: '/_next/static/chunks/1996.8db05bea08cc1a1a.js',
          revision: '8db05bea08cc1a1a',
        },
        {
          url: '/_next/static/chunks/2040.23b02a382645c81a.js',
          revision: '23b02a382645c81a',
        },
        {
          url: '/_next/static/chunks/2200.f7c03cd5e819262c.js',
          revision: 'f7c03cd5e819262c',
        },
        {
          url: '/_next/static/chunks/2457.e1177dcd497af2b8.js',
          revision: 'e1177dcd497af2b8',
        },
        {
          url: '/_next/static/chunks/2475.b444e0675611242f.js',
          revision: 'b444e0675611242f',
        },
        {
          url: '/_next/static/chunks/2511.0c449df2c314b1e0.js',
          revision: '0c449df2c314b1e0',
        },
        {
          url: '/_next/static/chunks/2568.1ab93719f77e6b61.js',
          revision: '1ab93719f77e6b61',
        },
        {
          url: '/_next/static/chunks/2626.15a8ca8ce1cbfcb4.js',
          revision: '15a8ca8ce1cbfcb4',
        },
        {
          url: '/_next/static/chunks/2767-7af702a35a082a24.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/2772.2ea76f566749d444.js',
          revision: '2ea76f566749d444',
        },
        {
          url: '/_next/static/chunks/2901-269517155c032145.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/2d6f572c.856fcdb88707a386.js',
          revision: '856fcdb88707a386',
        },
        {
          url: '/_next/static/chunks/3018.ba13982906e9b5f7.js',
          revision: 'ba13982906e9b5f7',
        },
        {
          url: '/_next/static/chunks/3028.73bb7fa1fcfad567.js',
          revision: '73bb7fa1fcfad567',
        },
        {
          url: '/_next/static/chunks/3370.6e27fafd575cc133.js',
          revision: '6e27fafd575cc133',
        },
        {
          url: '/_next/static/chunks/3435.9dab5706785a8b76.js',
          revision: '9dab5706785a8b76',
        },
        {
          url: '/_next/static/chunks/3470.e7e7d9469160e05a.js',
          revision: 'e7e7d9469160e05a',
        },
        {
          url: '/_next/static/chunks/3600.86b51f1ddf419393.js',
          revision: '86b51f1ddf419393',
        },
        {
          url: '/_next/static/chunks/361.5a275f30c9b50bbd.js',
          revision: '5a275f30c9b50bbd',
        },
        {
          url: '/_next/static/chunks/3663.4547ffc10425e435.js',
          revision: '4547ffc10425e435',
        },
        {
          url: '/_next/static/chunks/3678.ba566a6bb364011c.js',
          revision: 'ba566a6bb364011c',
        },
        {
          url: '/_next/static/chunks/3681.81bb8eb2a2de0b33.js',
          revision: '81bb8eb2a2de0b33',
        },
        {
          url: '/_next/static/chunks/3692.c8734e5c13e66bf9.js',
          revision: 'c8734e5c13e66bf9',
        },
        {
          url: '/_next/static/chunks/3704.1917bf1ad58b46d1.js',
          revision: '1917bf1ad58b46d1',
        },
        {
          url: '/_next/static/chunks/3717.be8975435785d4e3.js',
          revision: 'be8975435785d4e3',
        },
        {
          url: '/_next/static/chunks/3880.b0c7a35f05dd38cb.js',
          revision: 'b0c7a35f05dd38cb',
        },
        {
          url: '/_next/static/chunks/396.ed89ae6f85a88b79.js',
          revision: 'ed89ae6f85a88b79',
        },
        {
          url: '/_next/static/chunks/4004.d58831bde7c31cda.js',
          revision: 'd58831bde7c31cda',
        },
        {
          url: '/_next/static/chunks/423.8a8a78068ea645ce.js',
          revision: '8a8a78068ea645ce',
        },
        {
          url: '/_next/static/chunks/4274.d74fd9bdffd44f27.js',
          revision: 'd74fd9bdffd44f27',
        },
        {
          url: '/_next/static/chunks/4402.a10efb842f9e1d7c.js',
          revision: 'a10efb842f9e1d7c',
        },
        {
          url: '/_next/static/chunks/4554.fb8bd06696a51585.js',
          revision: 'fb8bd06696a51585',
        },
        {
          url: '/_next/static/chunks/4586.4bd7f9490d0363b5.js',
          revision: '4bd7f9490d0363b5',
        },
        {
          url: '/_next/static/chunks/462.fbb5b1b0eaf6e926.js',
          revision: 'fbb5b1b0eaf6e926',
        },
        {
          url: '/_next/static/chunks/4733.327e88cf16b47c19.js',
          revision: '327e88cf16b47c19',
        },
        {
          url: '/_next/static/chunks/493.a3e9bcb5b5c4d7ea.js',
          revision: 'a3e9bcb5b5c4d7ea',
        },
        {
          url: '/_next/static/chunks/495.553221546eed360f.js',
          revision: '553221546eed360f',
        },
        {
          url: '/_next/static/chunks/4978.90272438c215a93d.js',
          revision: '90272438c215a93d',
        },
        {
          url: '/_next/static/chunks/5046.39cac7c95d872006.js',
          revision: '39cac7c95d872006',
        },
        {
          url: '/_next/static/chunks/5149.bd3ef7aba803a292.js',
          revision: 'bd3ef7aba803a292',
        },
        {
          url: '/_next/static/chunks/5152.83086befc26231e3.js',
          revision: '83086befc26231e3',
        },
        {
          url: '/_next/static/chunks/5310.9c12755cdae393db.js',
          revision: '9c12755cdae393db',
        },
        {
          url: '/_next/static/chunks/5375.bd395f1f65a048e2.js',
          revision: 'bd395f1f65a048e2',
        },
        {
          url: '/_next/static/chunks/5678.160e664cd5b4ab18.js',
          revision: '160e664cd5b4ab18',
        },
        {
          url: '/_next/static/chunks/5727.7f828f3f61f316fa.js',
          revision: '7f828f3f61f316fa',
        },
        {
          url: '/_next/static/chunks/5821.697984e5a35f676a.js',
          revision: '697984e5a35f676a',
        },
        {
          url: '/_next/static/chunks/6011.bca0ea1b48c04be1.js',
          revision: 'bca0ea1b48c04be1',
        },
        {
          url: '/_next/static/chunks/6176.9928881d1203d423.js',
          revision: '9928881d1203d423',
        },
        {
          url: '/_next/static/chunks/6198.7c94818d349b3916.js',
          revision: '7c94818d349b3916',
        },
        {
          url: '/_next/static/chunks/620.2dc5429ca52199ad.js',
          revision: '2dc5429ca52199ad',
        },
        {
          url: '/_next/static/chunks/6258.e212944f3cf3fa5d.js',
          revision: 'e212944f3cf3fa5d',
        },
        {
          url: '/_next/static/chunks/6375.8f8a1891e1acad03.js',
          revision: '8f8a1891e1acad03',
        },
        {
          url: '/_next/static/chunks/6515.f0e33395e50ef2f2.js',
          revision: 'f0e33395e50ef2f2',
        },
        {
          url: '/_next/static/chunks/6564.b35adf7ae57c3790.js',
          revision: 'b35adf7ae57c3790',
        },
        {
          url: '/_next/static/chunks/6674.d3ddd42f163af4da.js',
          revision: 'd3ddd42f163af4da',
        },
        {
          url: '/_next/static/chunks/6760.fdfed00e18053eb7.js',
          revision: 'fdfed00e18053eb7',
        },
        {
          url: '/_next/static/chunks/6993.8f14c139a4dd4bca.js',
          revision: '8f14c139a4dd4bca',
        },
        {
          url: '/_next/static/chunks/7173.1cdbfe9ab6a51b9a.js',
          revision: '1cdbfe9ab6a51b9a',
        },
        {
          url: '/_next/static/chunks/7337.58045a23354e7e9f.js',
          revision: '58045a23354e7e9f',
        },
        {
          url: '/_next/static/chunks/7416.f893d8dbec58337a.js',
          revision: 'f893d8dbec58337a',
        },
        {
          url: '/_next/static/chunks/7591.39deec2f685cb16c.js',
          revision: '39deec2f685cb16c',
        },
        {
          url: '/_next/static/chunks/7730.02dc079506ac36a9.js',
          revision: '02dc079506ac36a9',
        },
        {
          url: '/_next/static/chunks/7788.1e7ce73a4e051787.js',
          revision: '1e7ce73a4e051787',
        },
        {
          url: '/_next/static/chunks/7812.1ffc2d811f50412c.js',
          revision: '1ffc2d811f50412c',
        },
        {
          url: '/_next/static/chunks/7868.0b38518db0513a63.js',
          revision: '0b38518db0513a63',
        },
        {
          url: '/_next/static/chunks/789.7cc420d9e50c9e1a.js',
          revision: '7cc420d9e50c9e1a',
        },
        {
          url: '/_next/static/chunks/7939.4539e99c45aeef4a.js',
          revision: '4539e99c45aeef4a',
        },
        {
          url: '/_next/static/chunks/798.2f888c527d03ba52.js',
          revision: '2f888c527d03ba52',
        },
        {
          url: '/_next/static/chunks/81.298af4d08d8b6f15.js',
          revision: '298af4d08d8b6f15',
        },
        {
          url: '/_next/static/chunks/8186.6623b51223289595.js',
          revision: '6623b51223289595',
        },
        {
          url: '/_next/static/chunks/8251.45bcdd5eec663688.js',
          revision: '45bcdd5eec663688',
        },
        {
          url: '/_next/static/chunks/8468.e3026c789ede8478.js',
          revision: 'e3026c789ede8478',
        },
        {
          url: '/_next/static/chunks/8472.a4405c3086c58cbb.js',
          revision: 'a4405c3086c58cbb',
        },
        {
          url: '/_next/static/chunks/8800.263cd5ab928aecbd.js',
          revision: '263cd5ab928aecbd',
        },
        {
          url: '/_next/static/chunks/8852.d0ea44012e58e1a5.js',
          revision: 'd0ea44012e58e1a5',
        },
        {
          url: '/_next/static/chunks/912.bdd73db17d87fd74.js',
          revision: 'bdd73db17d87fd74',
        },
        {
          url: '/_next/static/chunks/9336.486a93ca7d698022.js',
          revision: '486a93ca7d698022',
        },
        {
          url: '/_next/static/chunks/9562.97ce04a8708b424b.js',
          revision: '97ce04a8708b424b',
        },
        {
          url: '/_next/static/chunks/9610.35901aee1c38871c.js',
          revision: '35901aee1c38871c',
        },
        {
          url: '/_next/static/chunks/9763.6e2e02a8b85e8d40.js',
          revision: '6e2e02a8b85e8d40',
        },
        {
          url: '/_next/static/chunks/9770.ee2e86dd5156eb60.js',
          revision: 'ee2e86dd5156eb60',
        },
        {
          url: '/_next/static/chunks/97929092.7364dab2d1974605.js',
          revision: '7364dab2d1974605',
        },
        {
          url: '/_next/static/chunks/9810.4b260c91be1de372.js',
          revision: '4b260c91be1de372',
        },
        {
          url: '/_next/static/chunks/9827.107ab896badd2781.js',
          revision: '107ab896badd2781',
        },
        {
          url: '/_next/static/chunks/9833.e2c26a1d77f06a35.js',
          revision: 'e2c26a1d77f06a35',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-2ab62ed17d177a07.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/app/layout-8475d4a8349465d1.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/app/page-1135de41592e1785.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/d7e22ffc.f096a59b96550235.js',
          revision: 'f096a59b96550235',
        },
        {
          url: '/_next/static/chunks/e05192e5.a7d95235a26d5418.js',
          revision: 'a7d95235a26d5418',
        },
        {
          url: '/_next/static/chunks/e54491a5-c4a653161f0c3246.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/framework-20afca218c33ed8b.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/main-app-e7109c706d23c75e.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/main-c6c12998e0d9e86d.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/pages/_app-b744a312466fcfba.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/pages/_error-35f697927d486ece.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-fd0528d934249564.js',
          revision: 'ZI4kxFNYcGl2yLSyB0o-h',
        },
        {
          url: '/_next/static/css/11a6ffc584b01ffb.css',
          revision: '11a6ffc584b01ffb',
        },
        {
          url: '/_next/static/css/12d7025b24a4bd43.css',
          revision: '12d7025b24a4bd43',
        },
        {
          url: '/_next/static/css/47fae0acd28b4e93.css',
          revision: '47fae0acd28b4e93',
        },
        {
          url: '/_next/static/css/ac681432b82e92c9.css',
          revision: 'ac681432b82e92c9',
        },
        {
          url: '/_next/static/media/19cfc7226ec3afaa-s.woff2',
          revision: '9dda5cfc9a46f256d0e131bb535e46f8',
        },
        {
          url: '/_next/static/media/21350d82a1f187e9-s.woff2',
          revision: '4e2553027f1d60eff32898367dd4d541',
        },
        {
          url: '/_next/static/media/8e9860b6e62d6359-s.woff2',
          revision: '01ba6c2a184b8cba08b0d57167664d75',
        },
        {
          url: '/_next/static/media/ba9851c3c22cd980-s.woff2',
          revision: '9e494903d6b0ffec1a1e14d34427d44d',
        },
        {
          url: '/_next/static/media/c5fe6dc8356a8c31-s.woff2',
          revision: '027a89e9ab733a145db70f09b8a18b42',
        },
        {
          url: '/_next/static/media/codicon.5b7d6fac.ttf',
          revision: '5b7d6fac',
        },
        {
          url: '/_next/static/media/df0a9ae256c0569c-s.woff2',
          revision: 'd54db44de5ccb18886ece2fda72bdfe0',
        },
        {
          url: '/_next/static/media/e4af272ccee01ff0-s.p.woff2',
          revision: '65850a373e258f1c897a2b3d75eb74de',
        },
        {
          url: '/icons/README.md',
          revision: '50fd5f2945838dce10169863e84c8f58',
        },
        {
          url: '/icons/icon.svg',
          revision: 'e495ecfae820cc72330ce228fac67c1c',
        },
        { url: '/manifest.json', revision: '64999ee2f1e9cfb74937a08ee304ba1d' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: c,
              state: a,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https?.*\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i,
      new e.CacheFirst({
        cacheName: 'static-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https?.*\.(js|css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-css',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https?:\/\/.*/i,
      new e.NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ));
});
