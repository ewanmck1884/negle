const fs = require('fs');
const topojson = require('topojson-client');
const d3geo = require('d3-geo');
const world = require('world-atlas/countries-110m.json');

const geoms = world.objects.countries.geometries;
const neighborIdx = topojson.neighbors(geoms);
const geojson = topojson.feature(world, world.objects.countries);

const EXCLUDE = new Set(["Antarctica", "Fr. S. Antarctic Lands"]);
const R2 = 6371 * 6371;

const all = geojson.features.map((f, i) => {
  const name = f.properties.name;
  const centroid = d3geo.geoCentroid(f);
  const areaKm2 = Math.round(d3geo.geoArea(f) * R2);
  return { i, name, centroid, areaKm2 };
});
const byIdx = {};
all.forEach(c => byIdx[c.i] = c);

const results = all
  .filter(c => !EXCLUDE.has(c.name) && c.areaKm2 > 0 && !isNaN(c.centroid[0]))
  .map(c => {
    const neighborNames = (neighborIdx[c.i] || [])
      .map(ni => byIdx[ni])
      .filter(n => n && !EXCLUDE.has(n.name))
      .map(n => ({ name: n.name, centroid: [Math.round(n.centroid[0]*100)/100, Math.round(n.centroid[1]*100)/100] }));
    return {
      name: c.name,
      centroid: [Math.round(c.centroid[0]*100)/100, Math.round(c.centroid[1]*100)/100],
      areaKm2: c.areaKm2,
      neighbors: neighborNames
    };
  });

const targets = results.filter(r => r.neighbors.length >= 3 && r.neighbors.length <= 8).map(r => r.name);

console.log("Total:", results.length, "Target-eligible:", targets.length);

fs.writeFileSync('negle_data.json', JSON.stringify({ countries: results, targets }));
console.log("bytes:", fs.statSync('negle_data.json').size);
