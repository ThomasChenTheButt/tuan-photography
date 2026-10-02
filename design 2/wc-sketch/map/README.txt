lakes-50m.json: the lakes drawn on the map and on the Flights globe.
Source: Natural Earth 1:50m Lakes (ne_50m_lakes), naturalearthdata.com, downloaded from
https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_lakes.geojson
Licence: public domain (Natural Earth terms of use). No permission or credit required.
Made smaller for design 2 on 2026-10-02: lakes of scalerank 6 or less (411 of 412), outlines
simplified (Douglas-Peucker, 0.015 degrees), coordinates rounded to 0.001 degree, rings
smaller than about 0.001 square degrees left out, properties cut to the name and scalerank.

lakes-10m-extra.json: the smaller lakes the 50m file lacks (Zurich, Lucerne, Thun, Brienz,
Neuchatel, Walen, Zug, Maggiore, Como, Garda and their like), drawn only close in: on the Flights
globe once a journey closes in on a region, on the map only at high zoom. Fetched only then.
Source: Natural Earth 1:10m Lakes and its Europe supplement (ne_10m_lakes, ne_10m_lakes_europe),
naturalearthdata.com, downloaded from
https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_lakes.geojson
https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_lakes_europe.geojson
Licence: public domain (Natural Earth terms of use). No permission or credit required.
Made on 2026-10-02: only lakes not already in lakes-50m.json (1628 of them), each larger than
about 15 square kilometres, outlines simplified (Douglas-Peucker, 0.003 degree, up to 0.009 for
the largest), islands under about 7.5 square kilometres left out, names kept, nothing else.
Written compactly: each ring as whole thousandths of a degree, its first point in full and then
the steps between points; app.js reads it back into ordinary GeoJSON.
