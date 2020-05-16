import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class StoreService {
  static readonly pharmacyUrl = 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json';
  constructor(
    private httpClient: HttpClient,
  ) { }


  getPharmacy(): import('rxjs').Observable<any> {
    return this.httpClient.get<any>(StoreService.pharmacyUrl)
      .pipe(
        map(res => {
          res.features.map(e => {
            e.geometry.coordinates = e.geometry.coordinates.reverse();
            e.properties.phone = e.properties.phone.replace(/\s*/g, '');
            if (e.properties.address.match('臺')) {
              e.properties.address = e.properties.address.replace('臺', '台');
            }
          });
          return res.features.filter(e => e.properties.mask_adult > 0 || e.properties.mask_child > 0);
        })
      );
  }

}
