import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ScheduleComponent } from './schedule/schedule.component';
import { StudentListComponent } from './student-list/student-list.component';
import { SyllabusComponent } from './syllabus/syllabus.component';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    ScheduleComponent,
    StudentListComponent,
    SyllabusComponent
  ],
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.css']
})
export class GroupManagementComponent {
  
  constructor(private router: Router) {}

  /**
   * Volver al dashboard
   */
  goBack(): void {
    this.router.navigate(['/teachers']);
  }
}