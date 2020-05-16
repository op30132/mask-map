import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { map, switchMap, filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { combineLatest } from 'rxjs';

import * as L from 'leaflet';
import 'leaflet.markercluster';

import * as turf from '@turf/turf';
import * as bbox from '@turf/bbox';
import * as bboxPolygon from '@turf/bbox-polygon';
import * as intersect from '@turf/intersect';
import { StoreService } from '../services/store.service';
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.sass']
})
export class MapComponent implements OnInit {
  map: any;
  pharmacyList: Array<any>;
  group: L.MarkerClusterGroup;
  icons: any;
  prevPoint: any;
  constructor(
    public storeService: StoreService,
  ) {
    this.icons = {
      red: this.customIcon('red'),
      orange: this.customIcon('orange'),
      yellow: this.customIcon('yellow'),
      green: this.customIcon('green'),
      blue: this.customIcon('blue'),
      violet: this.customIcon('violet'),
      gold: this.customIcon('gold'),
      grey: this.customIcon('grey'),
    };
  }
  ngOnInit() {
    this.getStoreData();
  }
  getStoreData(): void {

    this.storeService.getPharmacy().pipe(
      map(data => {

        const info = data.reduce((total, el) => {
          total.push({ ...el.properties, coordinates: el.geometry.coordinates });
          return total;
        }, []);
        return {
          pharmacyPoint: info,
        };
      })
    ).subscribe(res => {
      if (!this.map) { this.initMap([25.0677505, 121.5470599]); }
      this.renderMap(res);
    });
  }
  initMap(location: any): void {
    this.map = L.map('map', {
      center: location,
      zoom: 10,
      zoomControl: false,
      layers: [L.tileLayer(
        'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token={accessToken}',
        {
          attribution: 'Map data',
          maxZoom: 16,
          accessToken: environment.token
        }
      )]
    });
    this.map.setView(location, 10);
  }

  renderMap(data: any) {
    if (this.group) {
      this.map.removeLayer(this.group);
    }

    this.group = new L.MarkerClusterGroup().addTo(this.map);

    data.pharmacyPoint.map((e, i) => {
      this.addMarker(e);
    });
    this.map.addLayer(this.group);


    if (this.prevPoint) {
      this.map.removeLayer(this.prevPoint);
    }

  }
  onPharmacy(info) {
    this.map
      .setView(info.coordinates, 16)
      .closePopup();

    if (this.prevPoint) {
      this.map.removeLayer(this.prevPoint);
    }

    this.prevPoint = L.marker(info.coordinates, { icon: this.icons.red })
      .addTo(this.map);
  }
  addMarker(info) {
    const range = info.mask_adult;
    let icon = this.icons.grey;

    if (range > 100) {
      icon = this.icons.green;
    } else if (range > 50) {
      icon = this.icons.yellow;
    } else if (range > 0) {
      icon = this.icons.red;
    }
    const marker = L.marker(info.coordinates, { icon }).bindPopup(this.customPopup(info));
    this.group.addLayer(marker);
  }
  customPopup(info) {
    return `
      <div class="customPopup">
        <div class="customPopup__title">${ info.name}</div>
        <div class="customPopup__block-left">
          <div class="customPopup__addr">${ info.address}</div>
          <div class="customPopup__note">${ info.note}</div>
          <div class="customPopup__phone">${ info.phone}</div>
        </div>
        <div class="customPopup__block-right">
          <div class="customPopup__block-flex">
            <div class="customPopup__child">
              <p>小孩</p>
              <p>${ info.mask_child}</p>
            </div>
            <div class="customPopup__adult">
              <p>大人</p>
              <p>${ info.mask_adult}</p>
            </div>
          </div>
        </div>
        <div class="customPopup__updated">更新時間：${ info.updated}</div>
      </div>
    `;
  }
  customIcon(color: string) {
    return L.icon({
      iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
}
