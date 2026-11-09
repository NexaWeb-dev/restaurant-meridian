# Meridian Coffee Atlas

A premium coffee-shop discovery site (HTML, CSS and vanilla JavaScript only). Original brand and design;
the Third Wave Coffee cafe locator was used purely as a functional reference.

**This is a demonstration project. Every café, phone number, address and opening hour is sample data.**
Phone numbers use the invalid prefix `+91 00000`. Coordinates point to real localities, not real shops.

## Run it

Open `index.html` in a browser, or serve the folder (recommended, and required for some browsers to allow
location detection on a trusted origin):

    python -m http.server 8000      # then visit http://localhost:8000

An internet connection is needed for map tiles (OpenStreetMap) and Google Fonts. Leaflet is stored locally
in `assets/vendor/leaflet`.

## Structure

    index.html            discovery page (hero search, filters, list/map, cities, story, contact)
    cafe-details.html     single café page, opened as cafe-details.html?id=<cafe id>
    privacy.html, terms.html
    css/    style.css (base, nav, hero, footer) · components.css · responsive.css
    js/     cafes-data.js  sample dataset and city list (replace this with real data)
            utils.js       formatting, open/closed status (India time), links, card template
            location.js    Geolocation API, Haversine distance, reverse-geocoding integration point
            search.js      free-text search      filters.js  state > city > area filters and sorting
            pagination.js  paging control        map.js      Leaflet map and custom coffee markers
            main.js        index page controller details.js   details page    legal.js  legal pages
    assets/ images (cafes/, cities/), icons, vendor/leaflet

## Replacing the sample data

Each record in `js/cafes-data.js` needs: `id, name, city, state, area, address, latitude, longitude, phone,
openingTime, closingTime, weeklyOpeningHours, image, galleryImages`. `weeklyOpeningHours` is
`{ mon..sun: { open: 'HH:MM', close: 'HH:MM' } | null }` (null = closed). Open/closed status is computed in the
browser from those hours, so it is only as accurate as the schedule supplied.

## Location and reverse geocoding

"Use My Current Location" calls the browser Geolocation API after the visitor clicks and grants permission.
Distances are straight-line (Haversine). Nothing is shown unless a position was actually obtained. Reverse
geocoding is an **integration point only** (`REVERSE_GEOCODER` in `js/location.js`); it is disabled by default
and sends no data anywhere.

## Limits of a static site

Live opening status, verified listings, user-submitted cafés and persistent updates need a trusted data source
and a backend. The contact form validates and confirms but does not send.

## Credits

Café photographs: Unsplash. City photographs: Wikimedia Commons (CC BY / CC BY-SA, credited in the site footer).
Map data © OpenStreetMap contributors. Map library: Leaflet.
