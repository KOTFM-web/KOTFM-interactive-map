 import {showSegmentList, initSegment, ActiveSegment, closeSegment, normalSegmentView, selectedSegmentView} from './segments.js';

// Kaart maken
const map = L.map('map');




// OpenStreetMap tiles toevoegen
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  maxNativeZoom: 16,
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
}).addTo(map);

// Plaatsnamen bovenop de grijze basiskaart
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  maxNativeZoom: 16
}).addTo(map);

let allLatLngs = [];
let allBounds = null;
let segmentCache = [];

const activeSegment = new ActiveSegment(null);


function segmentInView(seg, bounds){
  const latlngs = polyline.decode(seg.map.polyline);
  return latlngs.some(latlng => bounds.contains(L.latLng(latlng[0], latlng[1])));
}

// update segmentlijst bij verschuiven/zoomen van kaart
map.on("moveend", () => {
  if(!activeSegment.getActive()){
    const currentBounds = map.getBounds();
    const visibleSegments = segmentCache.filter(seg => segmentInView(seg, currentBounds));
    showSegmentList(visibleSegments, map, activeSegment);
  }

  segmentCache.forEach(seg => {
      if(seg !== activeSegment.getActive()){
        normalSegmentView(seg, map);
      }
      else{
        selectedSegmentView(seg, map);
      }
  });
});

fetch("data/segment_data.json")
    .then(res => res.json())
    .then(segmenten => {

    segmentCache = segmenten;
    allLatLngs = [];

    const segmentListDiv = document.getElementById("segment-details");
    segmentListDiv.innerHTML = ""; // leegmaken

    segmenten.forEach(seg => {

        const latlngs = polyline.decode(seg.map.polyline);
        allLatLngs.push(...latlngs); // voegt alle punten samen

        initSegment(seg, map, latlngs, activeSegment);
    });


    allBounds = L.latLngBounds(allLatLngs);
    map.fitBounds(allBounds);
    showSegmentList(segmentCache, map, activeSegment);
});
document.getElementById("close-btn").addEventListener("click", () => {

  closeSegment(activeSegment, map, segmentCache, false);
  
});
/*test*/


//const handle = document.getElementById('drag-handle');
//const sidebar = document.getElementById('sidebar');

const handle = document.getElementById('drag-handle');
const sidebar = document.getElementById('sidebar');

//mobile view
if (window.innerWidth <= 600) {
    sidebar.style.height = `200px`;
}


if (window.innerWidth <= 600) {
  document.getElementById('map').style.height =
    `calc(100vh - ${sidebar.offsetHeight}px)`;
  map.invalidateSize();
}


let isDragging = false;
let startY = 0;
let startHeight = 0;

// This function will handle the movement
const onPointerMove = (e) => {
  if (!isDragging) return;
  
  const dy = startY - e.clientY;
  let newHeight = startHeight + dy;
  
  // Constrain the new height
  newHeight = Math.min(Math.max(newHeight, 50), window.innerHeight * 0.9);

  sidebar.style.height = `${newHeight}px`;
  document.getElementById('map').style.height = `calc(100vh - ${newHeight}px)`;
  //map.invalidateSize();
};

// This function will stop the drag
const onPointerUp = () => {
  if (!isDragging) return;
  
  isDragging = false;
  
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  
};

// This listener starts the drag
handle.addEventListener('pointerdown', e => {
  // Only run on "mobile" view
  if (window.innerWidth > 600) {
    return;
  }
  
  
  e.preventDefault();
  
  isDragging = true;
  startY = e.clientY;
  startHeight = sidebar.offsetHeight;
  
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
});

