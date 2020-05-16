import { Component } from '@angular/core';
import { StoreService } from './services/store.service';
import { switchMap, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

}
