import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import * as L from 'leaflet';
import 'leaflet.markercluster';

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
  center = [25.0677505, 121.5470599];
  constructor(
    public storeService: StoreService,
  ) {
    this.icons = {
      red: this.customIcon('red'),
      yellow: this.customIcon('yellow'),
      green: this.customIcon('green'),
      grey: this.customIcon('grey'),
    };
  }
  ngOnInit() {
    this.getLocation(this.successLocation, this.failureLocation);
  }
  getLocation(successCallback, failureCallback) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallback, failureCallback);
    }
  }
  successLocation = (position) => {
    this.center = [position.coords.latitude, position.coords.longitude];
    this.getStoreData();
  }
  failureLocation = () => {
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
      if (!this.map) { this.initMap(this.center); }
      this.renderMap(res);
    });
  }
  initMap(location: any): void {
    this.map = L.map('map', {
      center: location,
      zoom: 14,
      zoomControl: false,
      layers: [L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${environment.token}`,
        {
          attribution: 'Map data',
          maxZoom: 16,
          accessToken: environment.token
        }
      )]
    });
    this.map.setView(location, 14);
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
      <div class="popup">
        <h3 class="popup_title">${ info.name}</h3>
        <div class="media mt-3">
          <div class="mr-2"><i class="fas fa-map-marker-alt"></i></div>
          <div class="media-body">
            ${ info.address}
          </div>
        </div>
        <div class="media mt-2">
          <div class="mr-2"><i class="fas fa-phone"></i></div>
          <div class="media-body">
            ${ info.phone}
          </div>
        </div>
        <div class="d-flex">
          <div class="flex-fill">
            <p>小孩</p>
            <p class="mask_number">${ info.mask_child}</p>
          </div>
          <div class="flex-fill">
            <p>大人</p>
            <p class="mask_number">${ info.mask_adult}</p>
          </div>
        </div>
        <small class="customPopup_updated">更新時間：${ info.updated}</small>
      </div>
    `;
  }
  customIcon(color: string) {
    return L.icon({
      iconUrl: `./assets/image/marker-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 33],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
}
