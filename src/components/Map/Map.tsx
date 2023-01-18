import { useEffect, useState } from 'react';
import styles from './Map.module.scss';
import MapView from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import View from 'ol/View.js';
import { ZoomSlider } from 'ol/control.js';
import { Tile as TileLayer } from 'ol/layer.js';
import Point from 'ol/geom/Point.js';
import VectorLayer from 'ol/layer/Vector';
import { Feature } from 'ol';
import VectorSource from 'ol/source/Vector';
import { LineString, Geometry } from 'ol/geom';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style.js';
import Overlay from 'ol/Overlay';
import Routes from '../routes/Routes';
import {
  useGetRoutesQuery,
  useLazyGetRouteByIdQuery,
} from '../../store/services/mapApi';
import { Route, RouteData } from '../../types';
import { Coordinate } from 'ol/coordinate';
import { toast } from 'react-toastify';
import { fromLonLat } from 'ol/proj.js';
const Map = () => {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [map] = useState(
    new MapView({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    })
  );

  const { data: routes = [] } = useGetRoutesQuery();
  const [trigger, { data, isError }] = useLazyGetRouteByIdQuery();

  useEffect(() => {
    initMap(map);
    return () => {};
  }, [map]);

  useEffect(() => {
    if (currentRoute) {
      trigger(currentRoute.id);
    }
  }, [trigger, currentRoute]);

  useEffect(() => {
    const mapLayers = map.getAllLayers();
    const routeLayerIndex = mapLayers.findIndex(
      l => l.getProperties()['type'] === 'route'
    );
    const view = map.getView();
    if (isError || data?.length === 0) {
      if (!isError) {
        toast.error('Маршрут пустой', {
          position: 'bottom-right',
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'dark',
        });
      }
      mapLayers[routeLayerIndex] = createRouteVectorLayer([]);
      map.setLayers(mapLayers);
      view.animate({
        center: [0, 0],
        duration: 2000,
        zoom: 2,
      });

      return;
    }
    if (data) {
      const vectorLayer = createRouteVectorLayer(data, currentRoute?.color);
      mapLayers[routeLayerIndex] = vectorLayer;

      map.setLayers(mapLayers);
      view.animate({
        center: fromLonLat([data[0].lon, data[0].lat]),
        duration: 2000,
        zoom: 10,
      });
    }
  }, [data, isError, map]);

  return (
    <div id='map'>
      <div className={styles.popup} id='popup'>
        <button
          className={styles.close}
          onClick={() => {
            map.getOverlayById('popup').setPosition(undefined);
          }}
        >
          ✕
        </button>
        <div id='popup-content' className={styles.content}></div>
      </div>
      <div className={styles.routes}>
        {routes && (
          <Routes
            routes={routes}
            currentRoute={currentRoute}
            setCurrentRoute={setCurrentRoute}
          />
        )}
      </div>
    </div>
  );
};

export default Map;

const createRouteVectorLayer = (data: RouteData[], color: string = 'blue') => {
  const route = new LineString(data.map(d => [d.lon, d.lat])).transform(
    'EPSG:4326',
    'EPSG:3857'
  );
  const routeFeature = new Feature({
    geometry: route,
    type: 'line',
  });

  const features: Feature<Geometry>[] = [];
  data.forEach(g => {
    features.push(
      new Feature({
        type: 'point',
        geometry: new Point([g.lon, g.lat]).transform('EPSG:4326', 'EPSG:3857'),
        ...g,
      })
    );
  });
  features.push(routeFeature);
  const vectorSource = new VectorSource({
    features,
  });
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      stroke: new Stroke({
        width: 3,
        color,
      }),
      image: new CircleStyle({
        radius: 3,
        fill: new Fill({ color }),
      }),
    }),
    properties: {
      type: 'route',
    },
  });

  return vectorLayer;
};

const initMap = (map: MapView) => {
  const zoomSlider = new ZoomSlider();
  map.setTarget('map');
  map.addControl(zoomSlider);
  const vectorRouteLayer = new VectorLayer({
    properties: {
      type: 'route',
    },
  });
  const container = document.getElementById('popup');
  const content = document.getElementById('popup-content');
  let overlay: Overlay;
  if (container) {
    overlay = new Overlay({
      element: container,
      id: 'popup',
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
    map.addOverlay(overlay);
    map.addLayer(vectorRouteLayer);
  }
  map.on('click', e => {
    const coordinate = e.coordinate;
    var iconFeatureA = map.getFeaturesAtPixel(e.pixel);
    if (iconFeatureA.length === 0 || iconFeatureA[0].get('type') === 'line') {
      overlay.setPosition(undefined);
      return;
    }
    if (content) {
      var time = iconFeatureA[0].get('time');
      var lon = iconFeatureA[0].get('lon');
      var lat = iconFeatureA[0].get('lat');
      var course = iconFeatureA[0].get('course');
      var speed = iconFeatureA[0].get('speed');
      const date = new Date(time);

      content.innerHTML = `
    <p><strong>Time:</strong> ${date.toLocaleTimeString()} ${date.toLocaleDateString()}</p>
   <p>
   <strong>Coordinate:</strong> 
   <em>Lon:</em> ${lon.toFixed(2)}
   <em>Lat:</em> ${lat.toFixed(2)}
   </p>
   <p><strong>Course</strong>: ${course}</p>
   <p><strong>Speed</strong>: ${speed}</p>`;
      overlay.setPosition(coordinate);
      e.preventDefault();
    }
  });
};
