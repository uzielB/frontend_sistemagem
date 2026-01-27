import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PreinscripcionModalComponent } from './preinscripcion-modal.component';

interface Carrera {
  titulo: string;
  descripcion: string;
  icono: string; // Comentario para el icono que necesitas
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule,
    NavbarComponent  // ← IMPORTAR LA NAVBAR COMPARTIDA
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  // Lista de carreras para la sección "Oferta Educativa"
  carreras: Carrera[] = [
    {
      titulo: 'Arquitectura e Imagen',
      descripcion: 'La licenciatura en Arquitectura e Imagen formará profesionales que sean capaces de proyectar, construir y emprender soluciones a las necesidades del habitar humano y arquitectónico, con un enfoque innovador, estético e interdisciplinar',
      icono: 'architecture' // ICON: Usa un icono de edificio/arquitectura de Bootstrap Icons o FontAwesome
    },
    {
      titulo: 'Trabajo Social',
      descripcion: 'Formar profesionales en Trabajo Social que puedan conocer, comprender y aplicar las teorías y metodologías del Trabajo Social y la investigación de la propia disciplina',
      icono: 'people' // ICON: Usa un icono de personas/comunidad
    },
    {
      titulo: 'Ciencias de la Educación',
      descripcion: 'Desarrollar las competencias que permitan comprender y explicar las realidades educativas a partir de los contextos y las tendencias locales, nacionales e internacionales',
      icono: 'school' // ICON: Usa un icono de graduación/educación
    },
    {
      titulo: 'Derecho',
      descripcion: 'Desarrollar en el estudiante de la licenciatura en derecho la capacidad argumentativa, de interpretación jurídica y analítica para resolver problemas de forma eficiente y generar soluciones eficaces, que demanda actualmente la especialización de los campos de conocimiento de la ciencia jurídica',
      icono: 'balance' // ICON: Usa un icono de balanza/justicia
    },
    {
      titulo: 'Diseño Gráfico y Mercadotecnia Publicitaria',
      descripcion: 'El alumno será capaz de conocer y analizar enfoques vanguardistas del Diseño Gráfico y la Mercadotecnia Publicitaria a través de conceptos teóricos y prácticos para implementar sus competencias en el plano laboral en las áreas señaladas',
      icono: 'design' // ICON: Usa un icono de paleta/diseño
    },
    {
      titulo: 'Fisioterapia',
      descripcion: 'Formar de manera integral profesionales de la fisioterapia, creativos, éticos, solidarios, con pensamiento investigativo, capaces de valorar la salud como elemento esencial de la vida humana, con actitud de servicio, disposición en el quehacer individual y en equipo que contribuyan al',
      icono: 'heart-pulse' // ICON: Usa un icono de salud/corazón
    },
    {
      titulo: 'Psicopedagogía',
      descripcion: 'Generar la formación de profesionales de la Psicopedagogía con conocimientos sobre los procesos de enseñanza, aprendizaje y desarrollo humano, con capacidad de reflexión y análisis que vinculen la teoría y el conocimiento obtenido bajo un enfoque pragmático',
      icono: 'brain' // ICON: Usa un icono de cerebro/mente
    }
  ];

  // Información de contacto
  contacto = {
    telefonos: ['951 132 7733', '951 464 9389'],
    email: 'info@gem.edu.mx',
    institucion: 'GEM Oaxaca',
    direccion: {
      calle: 'Calle Brasil #320',
      colonia: 'Col. América Sur',
      ciudad: 'Oaxaca de Juárez, Oax.'
    }
  };

  constructor(private dialog: MatDialog) {}

  // Abrir modal de preinscripción
  abrirModalPreinscripcion(): void {
    this.dialog.open(PreinscripcionModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'preinscripcion-modal',
      autoFocus: false,
      disableClose: false
    });
  }

  // NOTA: Ya no necesitamos scrollToSection aquí porque la navbar lo maneja
  // Pero lo dejamos por si se necesita en el futuro
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}