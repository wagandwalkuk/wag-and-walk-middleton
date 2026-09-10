import assert from 'node:assert/strict';
import worker from '../src/worker.js';

let count = 0;
const env = { ASSETS: { fetch: async () => new Response('asset') } };
for (const scheme of ['http', 'https']) {
  for (const host of ['wagandwalk.uk', 'www.wagandwalk.uk']) {
    for (const [path, expected] of [
      ['/about', '/about'], ['/about.html', '/about'], ['/about/', '/about'],
      ['/areas/dog-walker-middleton/', '/areas/dog-walker-middleton'],
      ['/blog/how-much-exercise-does-a-cockapoo-need.html', '/blog/how-much-exercise-does-a-cockapoo-need'],
      ['/pickup-dropoff/', '/services'], ['/pickup-dropoff.html', '/services'], ['/index.html', '/']
    ]) {
      const url = `${scheme}://${host}${path}?source=test`;
      const target = `https://www.wagandwalk.uk${expected}?source=test`;
      const response = await worker.fetch(new Request(url), env);
      assert.equal(response.status, url === target ? 200 : 301, url);
      assert.equal(response.headers.get('location'), url === target ? null : target, url);
      assert.equal((await worker.fetch(new Request(target), env)).status, 200, target);
      count++;
    }
  }
}
for (const url of ['http://127.0.0.1:8775/about', 'https://www.wagandwalk.uk/web/', 'https://www.wagandwalk.uk/images/logo.png']) {
  assert.equal((await worker.fetch(new Request(url), env)).status, 200, url);
  count++;
}
const api = await worker.fetch(new Request('https://www.wagandwalk.uk/api/contact', { method: 'POST' }), env);
assert.equal(api.status, 503); // Reaches the API's configuration check, not a redirect.
console.log(`${count + 1} redirect and routing checks passed.`);
