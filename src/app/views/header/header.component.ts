import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SettingsDialogComponent} from '../../dialogs/settings-dialog/settings-dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})


export class HeaderComponent implements OnInit {

  @Input()
  categoryName: string;

  @Input()
  private showStat: boolean;

  @Output()
  toggleStat = new EventEmitter<boolean>(); // показать/скрыть статистику


  constructor(private dialog: MatDialog
  ) {
  }

  ngOnInit() {
  }

  private onToggleStat() {
    this.toggleStat.emit(!this.showStat); // вкл/выкл статистику
  }

  // окно настроек
  private showSettings() {
    const dialogRef = this.dialog.open(SettingsDialogComponent,
      {
        autoFocus: false,
        width: '500px'
      });

    // никаких действий не требуется после закрытия окна

  }


}
