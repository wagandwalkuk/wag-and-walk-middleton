"""Read-only sitemap, markup, link and live canonical audit. Run from repo root."""
import concurrent.futures
import json
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError
import xml.etree.ElementTree as ET

BASE = "https://www.wagandwalk.uk"

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.links, self.canonicals, self.og, self.robots, self.schemas = [], [], [], [], []
        self.ids, self.h1, self.ld = set(), 0, None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.add(a["id"])
        if tag == "h1": self.h1 += 1
        if tag == "a" and a.get("href"): self.links.append(a["href"])
        if tag == "link" and a.get("rel") == "canonical": self.canonicals.append(a.get("href"))
        if tag == "meta" and a.get("property") == "og:url": self.og.append(a.get("content"))
        if tag == "meta" and a.get("name") == "robots": self.robots.append(a.get("content", ""))
        if tag == "script" and a.get("type") == "application/ld+json": self.ld = ""

    def handle_data(self, data):
        if self.ld is not None: self.ld += data

    def handle_endtag(self, tag):
        if tag == "script" and self.ld is not None:
            self.schemas.append(json.loads(self.ld))
            self.ld = None

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args): return None

def fetch(url):
    try:
        r = build_opener(NoRedirect).open(Request(url, headers={"User-Agent": "WagWalkSiteAudit/1.0"}), timeout=25)
    except HTTPError as e:
        r = e
    return r.status, dict(r.headers.items()), r.read().decode("utf-8", errors="replace")

def live(url):
    status, headers, body = fetch(url)
    headers = {k.lower(): v for k, v in headers.items()}
    p = Page(body) if status == 200 else None
    return {"url": url, "status": status, "location": headers.get("location"),
            "canonical": p.canonicals if p else [], "og": p.og if p else [],
            "robots": p.robots if p else [], "x_robots": headers.get("x-robots-tag"),
            "link_header": headers.get("link")}

def main():
    urls = [e.text for e in ET.parse("sitemap.xml").iter() if e.tag.endswith("}loc")]
    pages, issues, graph = {}, [], {}
    for folder in [Path("."), Path("areas"), Path("blog"), Path("behind-the-lead")]:
        for f in folder.glob("*.html"):
            path = "/" if str(f) == "index.html" else "/" + str(f.with_suffix(""))
            pages[path] = Page(f.read_text())
    for url in urls:
        path = urlsplit(url).path
        p = pages[path]
        if p.canonicals != [url] or p.og != [url] or p.h1 != 1 or any("noindex" in r for r in p.robots):
            issues.append([path, "metadata", p.canonicals, p.og, p.h1, p.robots])
        graph[path] = set()
        for href in p.links:
            target = urlsplit(urljoin(url, href))
            if target.hostname not in {"wagandwalk.uk", "www.wagandwalk.uk"}: continue
            dest = target.path
            if target.scheme != "https" or target.hostname != "www.wagandwalk.uk" or dest.endswith(".html") or dest == "/pickup-dropoff":
                issues.append([path, "noncanonical link", href])
            if dest in pages:
                graph[path].add(dest)
                if target.fragment and target.fragment not in pages[dest].ids:
                    issues.append([path, "missing anchor", href])
            elif not Path(dest.lstrip("/")).is_file():
                issues.append([path, "missing target", href])
    depths, pending = {"/": 0}, ["/"]
    while pending:
        current = pending.pop(0)
        for dest in graph.get(current, []):
            if dest not in depths:
                depths[dest] = depths[current] + 1
                pending.append(dest)
    result = {"sitemap_count": len(urls), "duplicate_urls": len(urls)-len(set(urls)), "issues": issues,
              "depths": depths, "orphans": [u for u in urls if urlsplit(u).path not in depths],
              "outside_sitemap": [p for p in pages if BASE+p not in urls]}
    if "--live" in sys.argv:
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            result["live"] = list(pool.map(live, urls))
        variants = [s+"://"+h+p for s in ["http", "https"] for h in ["wagandwalk.uk", "www.wagandwalk.uk"]
                    for p in ["/about", "/about.html", "/about/", "/pickup-dropoff.html", "/index.html"]]
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            result["variants"] = list(pool.map(live, variants))
    print(json.dumps(result, indent=2))

if __name__ == "__main__": main()
