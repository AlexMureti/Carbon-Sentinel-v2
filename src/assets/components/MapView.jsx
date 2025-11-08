import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for waste sites
const wasteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 13 });
    
    const onLocationFound = (e) => {
      if (onLocationFound) {
        onLocationFound(e.latlng);
      }
    };

    map.on('locationfound', onLocationFound);
    return () => {
      map.off('locationfound', onLocationFound);
    };
  }, [map, onLocationFound]);

  return null;
}

export default function MapView({ onLocationSelect, selectedLocation }) {
  const [reports, setReports] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [co2Data, setCo2Data] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Default center for Kenya (Nairobi)
  const defaultCenter = [-1.2921, 36.8219];

  useEffect(() => {
    // Subscribe to reports in real-time
    const q = query(
      collection(db, 'reports'),
      where('status', 'in', ['Submitted', 'In Review', 'Resolved'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch weather and air quality data for Kenya
    if (userLocation) {
      fetchEnvironmentalData(userLocation.lat, userLocation.lng);
    } else {
      // Fetch for default location (Nairobi)
      fetchEnvironmentalData(defaultCenter[0], defaultCenter[1]);
    }
  }, [userLocation]);

  const fetchEnvironmentalData = async (lat, lng) => {
    try {
      // Fetch weather data from Open-Meteo
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m&timezone=Africa/Nairobi`
      );
      const weatherJson = await weatherResponse.json();
      setWeatherData(weatherJson.current);

      // Fetch air quality data from Open-Meteo
      const aqResponse = await fetch(
        `https://api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide&timezone=Africa/Nairobi`
      );
      const aqJson = await aqResponse.json();
      setCo2Data(aqJson.current);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
    }
  };

  const handleMapClick = (e) => {
    if (onLocationSelect) {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          if (onLocationSelect) {
            onLocationSelect(loc);
          }
          if (mapRef.current) {
            mapRef.current.flyTo([loc.lat, loc.lng], 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return 'green';
      case 2: return 'yellow';
      case 3: return 'orange';
      case 4: return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Environmental Data Panel */}
      {(weatherData || co2Data) && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-bold text-lg mb-2 text-gray-800">Environmental Data</h3>
          {weatherData && (
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Temperature:</span>
                <span className="font-semibold">{weatherData.temperature_2m}°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Humidity:</span>
                <span className="font-semibold">{weatherData.relative_humidity_2m}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wind Speed:</span>
                <span className="font-semibold">{weatherData.wind_speed_10m} km/h</span>
              </div>
            </div>
          )}
          {co2Data && (
            <div className="space-y-2 border-t pt-3">
              <h4 className="font-semibold text-sm text-gray-700">Air Quality</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PM2.5:</span>
                <span className="font-semibold">{co2Data.pm2_5?.toFixed(1) || 'N/A'} µg/m³</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PM10:</span>
                <span className="font-semibold">{co2Data.pm10?.toFixed(1) || 'N/A'} µg/m³</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CO:</span>
                <span className="font-semibold">{co2Data.carbon_monoxide?.toFixed(1) || 'N/A'} µg/m³</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">NO₂:</span>
                <span className="font-semibold">{co2Data.nitrogen_dioxide?.toFixed(1) || 'N/A'} µg/m³</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Locate Me Button */}
      <button
        onClick={handleLocateMe}
        className="absolute top-4 left-4 z-[1000] bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg shadow-lg transition-colors"
        title="Find my location"
      >
        <Navigation className="h-5 w-5" />
      </button>

      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={7}
        className="h-full w-full"
        whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker onLocationFound={setUserLocation} />

        {/* Report Markers */}
        {reports.map((report) => (
          report.coords && (
            <Marker
              key={report.id}
              position={[report.coords.latitude, report.coords.longitude]}
              icon={wasteIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold">Category:</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{report.category}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold">Status:</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      report.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold">Severity:</span>
                    <div className={`w-3 h-3 rounded-full bg-${getSeverityColor(report.severity)}-500`}></div>
                    <span className="text-xs">Level {report.severity}</span>
                  </div>
                  {report.images && report.images.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{report.images.length} image(s) attached</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Selected Location Marker */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>
              <div className="p-2">
                <MapPin className="h-5 w-5 text-green-600 mb-1" />
                <p className="text-sm font-semibold">Selected Location</p>
                <p className="text-xs text-gray-600">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading map data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
