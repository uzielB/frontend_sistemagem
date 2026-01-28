import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PreinscripcionModalComponent } from './preinscripcion-modal.component';

interface Semestre {
  numero: number;
  materias: string[];
}

interface Carrera {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  descripcionCompleta: string;
  queAprenderas: string[];
  planEstudios: Semestre[];
  expanded: boolean; // Para controlar el acordeón
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule,
    MatIconModule,
    NavbarComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1',
        overflow: 'visible'
      })),
      transition('collapsed <=> expanded', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class HomeComponent {
  
  // Lista de carreras con información COMPLETA
  carreras: Carrera[] = [
    {
      id: 'arquitectura',
      titulo: 'Arquitectura e Imagen',
      descripcion: 'La licenciatura en Arquitectura e Imagen formará profesionales que sean capaces de proyectar, construir y emprender soluciones a las necesidades del habitar humano y arquitectónico, con un enfoque innovador, estético e interdisciplinar',
      icono: 'architecture',
      descripcionCompleta: 'La licenciatura en Arquitectura e Imagen formará profesionales que sean capaces de proyectar, construir y emprender soluciones a las necesidades del habitar humano y arquitectónico, con un enfoque innovador, estético e interdisciplinar dentro del marco de la ética y la sustentabilidad mediante los conocimientos y habilidades pertinentes para diagnosticar, proponer, diseñar, implementar y evaluar proyectos arquitectónicos, en todas sus modalidades. Con el compromiso de tener en cuenta las necesidades sociales, la sustentabilidad y el cuidado del medio ambiente, así como las disposiciones normativas existentes.',
      queAprenderas: [
        'Reconocer los problemas ambientales, sus orígenes y sus consecuencias',
        'Conocimientos sobre la sustentabilidad y la arquitectura',
        'Sobre las matemáticas aplicadas a la arquitectura',
        'Sobre las realidades espaciales y volumétricas',
        'Analizar los criterios de hábitat con condiciones de habitabilidad ambiental',
        'Principios del diseño y construcción ecológica',
        'Argumentar sólida y convincentemente sobre las técnicas ambientales de diseño y construcción',
        'Aplicar sistemáticamente sus conocimientos en el área de planificación, diseño y construcción',
        'Poseer un conocimiento adecuado de la historia y de las teorías de la arquitectura',
        'Identificar los problemas de concepción estructural, de construcción y de ingeniería civil',
        'Conocimientos de software para el diseño paramétrico',
        'Conocimientos sobre la legislación urbana',
        'Conocimientos básicos sobre la restauración arquitectónica',
        'Fotografía arquitectónica'
      ],
      planEstudios: [
        {
          numero: 1,
          materias: ['Expresión Arquitectónica I', 'Teoría de la Composición', 'Historia de la Arquitectura I', 'Matemáticas I', 'Métodos del Diseño', 'Geometría Descriptiva I']
        },
        {
          numero: 2,
          materias: ['Expresión Arquitectónica II', 'Historia de la Arquitectura II', 'Matemáticas II', 'Geometría Descriptiva II', 'Bocetos e Ilustración', 'Diseño por Computadora']
        },
        {
          numero: 3,
          materias: ['Diseño Arquitectónico I', 'Expresión Arquitectónica III', 'Tipología y Morfología Arquitectónica', 'Taller de Diseño del Mensaje Gráfico Arquitectónico', 'Teoría de la Arquitectura I', 'Topografía por Computadora']
        },
        {
          numero: 4,
          materias: ['Diseño Arquitectónico II', 'Expresión Arquitectónica IV', 'Estructuras I', 'Arquitectura Sustentable y Diseño Ecológico', 'Teoría de la Arquitectura II', 'Legislación Urbana']
        },
        {
          numero: 5,
          materias: ['Diseño Arquitectónico III', 'Expresión Arquitectónica V', 'Estructuras II', 'Construcción e Instalaciones I', 'Diseño y Cálculo de Instalaciones por Computadora', 'Trámites Legales en Arquitectura']
        },
        {
          numero: 6,
          materias: ['Diseño Arquitectónico IV', 'Metodología de la Investigación I', 'Estructuras III', 'Construcción e Instalaciones II', 'Análisis de Costos y Presupuestos por Computadora', 'Maquetas y Modelos']
        },
        {
          numero: 7,
          materias: ['Diseño Arquitectónico V', 'Metodología de la Investigación II', 'Estructuras IV', 'Construcción e Instalaciones III', 'Análisis de Estructuras por Computadora', 'Arquitectura del Paisaje I']
        },
        {
          numero: 8,
          materias: ['Diseño Arquitectónico VI', 'Seminario de Tesis', 'Restauración Arquitectónica', 'Fotografía Arquitectónica Digital', 'Control de Obra por Computadora', 'Arquitectura del Paisaje II']
        }
      ],
      expanded: false
    },
    {
      id: 'trabajo-social',
      titulo: 'Trabajo Social',
      descripcion: 'Formar profesionales en Trabajo Social que puedan conocer, comprender y aplicar las teorías y metodologías del Trabajo Social y la investigación de la propia disciplina',
      icono: 'people',
      descripcionCompleta: 'Formar profesionales en Trabajo Social que puedan conocer, comprender y aplicar las teorías y metodologías del Trabajo Social y la investigación de la propia disciplina, adquiriendo una formación sólida que les permita desempeñarse eficientemente en las áreas de salud pública, educación, comunitaria, vivienda, empresarial y jurídica, entre otras, así también, diseñar, intervenir, promover y gestionar acciones para mejorar la calidad y niveles de vida de los diferentes actores sociales, con una actitud de compromiso y bien común.',
      queAprenderas: [
        'En hechos cotidianos, precientíficos y científicos',
        'En los principios como los Derechos Humanos',
        'En las teorías: epistemológicas, socioeconómicas, biopsicológicas',
        'En los métodos de investigación científica: cualitativa, cuantitativa, etnográfica',
        'En los métodos de intervención profesional en diversas áreas',
        'En métodos lógicos del conocimiento científico',
        'En los conceptos de las disciplinas de la Carrera'
      ],
      planEstudios: [
        {
          numero: 1,
          materias: ['Evolución Histórica del Trabajo Social', 'Teoría Económica', 'Conceptos y Teorías del Trabajo Social', 'Epistemología', 'Técnicas Estadísticas de la Investigación', 'Dinámica de Grupos', 'Análisis Sociológico del Estado Mexicano', 'Inglés I']
        },
        {
          numero: 2,
          materias: ['Organización Social y Desarrollo Humano', 'Métodos y Técnicas de la Investigación Social', 'Comportamiento Organizativo', 'Bases Psicológicas: Individuo y Medio Social', 'Trabajo Social Comunitario', 'Política Social y Sistemas del Bienestar', 'Metodología del Trabajo Social', 'Inglés II']
        },
        {
          numero: 3,
          materias: ['Psicología del Desarrollo', 'Desarrollo Comunitario', 'Paradigmas de Investigación Social I', 'Teoría Social I', 'Ética y Deontología del Trabajo Social', 'Habilidades Sociales y de Comunicación para el Trabajo Social', 'Trabajo Social en el Entorno Rural', 'Inglés III']
        },
        {
          numero: 4,
          materias: ['Trabajo Social y Salud Mental', 'Derechos Humanos', 'Comunidad I (Práctica Comunitaria)', 'Paradigmas de Investigación Social II', 'Teoría Social II', 'Trabajo Social con Individuos y Familias', 'Psicología de la Intervención Social', 'Inglés IV']
        },
        {
          numero: 5,
          materias: ['Teoría Social III', 'Trabajo Social con Grupos', 'Comunidad II (Práctica Comunitaria)', 'Análisis Institucional', 'Diseño y Evaluación de Programas Sociales', 'Entorno Jurídico de la Familia', 'Trabajo Social y Discapacidad', 'Inglés V']
        },
        {
          numero: 6,
          materias: ['Psicopatología', 'Trabajo Social Regional I', 'Trabajo Social en la Administración y Procuración de Justicia', 'Trabajo Social y Violencia de Género', 'Desarrollo Social', 'Problemática Social Urbana', 'Tesis I']
        },
        {
          numero: 7,
          materias: ['Trabajo Social Regional II', 'Estadística Descriptiva', 'Intervención Socioeducativa', 'Seminario de Especialización I', 'Trabajo y Programación Social', 'Problemática Social Rural', 'Tesis II']
        },
        {
          numero: 8,
          materias: ['Estadística Inferencial', 'Trabajo Social en Empresa', 'Trabajo Social en Salud', 'Medición Comunitaria e Intercultural', 'Seminario de Especialización II', 'Seguimiento y Evaluación de Proyectos Sociales', 'Tesis III']
        }
      ],
      expanded: false
    },
    {
      id: 'ciencias-educacion',
      titulo: 'Ciencias de la Educación',
      descripcion: 'Desarrollar las competencias que permitan comprender y explicar las realidades educativas a partir de los contextos y las tendencias locales, nacionales e internacionales',
      icono: 'school',
      descripcionCompleta: 'Desarrollar las competencias que permitan comprender y explicar las realidades educativas a partir de los contextos y las tendencias locales, nacionales e internacionales. Formar profesionales con conocimientos sólidos en el ámbito educativo.',
      queAprenderas: [
        'Teorías pedagógicas contemporáneas',
        'Diseño y evaluación curricular',
        'Métodos de investigación educativa',
        'Psicología del aprendizaje',
        'Gestión educativa',
        'Didáctica y estrategias de enseñanza'
      ],
      planEstudios: [
        { numero: 1, materias: ['Introducción a las Ciencias de la Educación', 'Psicología General', 'Filosofía de la Educación', 'Sociología de la Educación'] },
        { numero: 2, materias: ['Psicología Educativa', 'Historia de la Educación', 'Metodología de la Investigación', 'Teorías Pedagógicas'] },
        { numero: 3, materias: ['Desarrollo Curricular', 'Didáctica General', 'Estadística Aplicada', 'Educación Comparada'] },
        { numero: 4, materias: ['Evaluación Educativa', 'Tecnología Educativa', 'Diseño Instruccional', 'Práctica Docente I'] },
        { numero: 5, materias: ['Administración Educativa', 'Orientación Educativa', 'Educación Especial', 'Práctica Docente II'] },
        { numero: 6, materias: ['Legislación Educativa', 'Planeación Educativa', 'Seminario de Tesis I', 'Práctica Profesional I'] },
        { numero: 7, materias: ['Políticas Educativas', 'Gestión de Proyectos Educativos', 'Seminario de Tesis II', 'Práctica Profesional II'] },
        { numero: 8, materias: ['Innovación Educativa', 'Ética Profesional', 'Seminario de Tesis III', 'Práctica Profesional III'] }
      ],
      expanded: false
    },
    {
      id: 'derecho',
      titulo: 'Derecho',
      descripcion: 'Desarrollar en el estudiante de la licenciatura en derecho la capacidad argumentativa, de interpretación jurídica y analítica para resolver problemas de forma eficiente y generar soluciones eficaces',
      icono: 'balance',
      descripcionCompleta: 'Desarrollar en el estudiante de la licenciatura en derecho la capacidad argumentativa, de interpretación jurídica y analítica para resolver problemas de forma eficiente y generar soluciones eficaces, que demanda actualmente la especialización de los campos de conocimiento de la ciencia jurídica.',
      queAprenderas: [
        'Derecho constitucional y derechos humanos',
        'Derecho civil y mercantil',
        'Derecho penal y procesal',
        'Derecho laboral y seguridad social',
        'Argumentación jurídica',
        'Litigio y práctica forense'
      ],
      planEstudios: [
        { numero: 1, materias: ['Introducción al Derecho', 'Teoría del Estado', 'Derecho Romano', 'Historia del Derecho Mexicano'] },
        { numero: 2, materias: ['Derecho Constitucional', 'Derecho Civil I', 'Derecho Penal I', 'Metodología Jurídica'] },
        { numero: 3, materias: ['Derecho Administrativo', 'Derecho Civil II', 'Derecho Penal II', 'Garantías Constitucionales'] },
        { numero: 4, materias: ['Derecho Mercantil I', 'Derecho Procesal Civil', 'Derecho Procesal Penal', 'Derecho Laboral'] },
        { numero: 5, materias: ['Derecho Mercantil II', 'Derecho Fiscal', 'Derecho Agrario', 'Seguridad Social'] },
        { numero: 6, materias: ['Derecho Internacional Público', 'Derecho Internacional Privado', 'Amparo', 'Práctica Forense'] },
        { numero: 7, materias: ['Derecho Económico', 'Derecho Ambiental', 'Ética Jurídica', 'Clínica Jurídica I'] },
        { numero: 8, materias: ['Derecho Notarial', 'Derecho Electoral', 'Seminario de Tesis', 'Clínica Jurídica II'] },
        { numero: 9, materias: ['Práctica Profesional', 'Titulación'] }
      ],
      expanded: false
    },
    {
      id: 'diseno-grafico',
      titulo: 'Diseño Gráfico y Mercadotecnia Publicitaria',
      descripcion: 'El alumno será capaz de conocer y analizar enfoques vanguardistas del Diseño Gráfico y la Mercadotecnia Publicitaria a través de conceptos teóricos y prácticos',
      icono: 'design',
      descripcionCompleta: 'El alumno será capaz de conocer y analizar enfoques vanguardistas del Diseño Gráfico y la Mercadotecnia Publicitaria a través de conceptos teóricos y prácticos para implementar sus competencias en el plano laboral en las áreas señaladas.',
      queAprenderas: [
        'Diseño gráfico digital y tradicional',
        'Estrategias de mercadotecnia',
        'Publicidad y medios digitales',
        'Branding e identidad corporativa',
        'Fotografía publicitaria',
        'Producción audiovisual'
      ],
      planEstudios: [
        { numero: 1, materias: ['Introducción al Diseño', 'Dibujo I', 'Teoría del Color', 'Historia del Arte'] },
        { numero: 2, materias: ['Diseño Básico', 'Dibujo II', 'Fotografía I', 'Tipografía'] },
        { numero: 3, materias: ['Diseño Digital I', 'Ilustración', 'Fotografía II', 'Marketing I'] },
        { numero: 4, materias: ['Diseño Digital II', 'Diseño Editorial', 'Producción Audiovisual', 'Marketing II'] },
        { numero: 5, materias: ['Diseño Web', 'Identidad Corporativa', 'Publicidad', 'Comportamiento del Consumidor'] },
        { numero: 6, materias: ['Diseño de Envase', 'Branding', 'Medios Digitales', 'Investigación de Mercados'] },
        { numero: 7, materias: ['Diseño de Experiencia', 'Estrategia Publicitaria', 'Social Media', 'Seminario de Tesis I'] },
        { numero: 8, materias: ['Portfolio Profesional', 'Emprendimiento', 'Proyecto Final', 'Seminario de Tesis II'] }
      ],
      expanded: false
    },
    {
      id: 'fisioterapia',
      titulo: 'Fisioterapia',
      descripcion: 'Formar de manera integral profesionales de la fisioterapia, creativos, éticos, solidarios, con pensamiento investigativo, capaces de valorar la salud como elemento esencial de la vida humana',
      icono: 'heart-pulse',
      descripcionCompleta: 'Formar de manera integral profesionales de la fisioterapia, creativos, éticos, solidarios, con pensamiento investigativo, capaces de valorar la salud como elemento esencial de la vida humana, con actitud de servicio, disposición en el quehacer individual y en equipo que contribuyan al bienestar físico de las personas.',
      queAprenderas: [
        'Anatomía y fisiología humana',
        'Técnicas de evaluación fisioterapéutica',
        'Modalidades terapéuticas',
        'Rehabilitación física',
        'Fisioterapia deportiva',
        'Terapia manual'
      ],
      planEstudios: [
        { numero: 1, materias: ['Anatomía I', 'Fisiología I', 'Bioquímica', 'Introducción a la Fisioterapia'] },
        { numero: 2, materias: ['Anatomía II', 'Fisiología II', 'Biomecánica', 'Kinesiología'] },
        { numero: 3, materias: ['Patología General', 'Evaluación Fisioterapéutica', 'Agentes Físicos', 'Farmacología'] },
        { numero: 4, materias: ['Fisioterapia en Ortopedia', 'Fisioterapia Neurológica I', 'Terapia Manual I', 'Ejercicio Terapéutico'] },
        { numero: 5, materias: ['Fisioterapia en Traumatología', 'Fisioterapia Neurológica II', 'Terapia Manual II', 'Rehabilitación'] },
        { numero: 6, materias: ['Fisioterapia Pediátrica', 'Fisioterapia Geriátrica', 'Fisioterapia Deportiva', 'Práctica Clínica I'] },
        { numero: 7, materias: ['Fisioterapia Cardiovascular', 'Fisioterapia Respiratoria', 'Investigación en Fisioterapia', 'Práctica Clínica II'] },
        { numero: 8, materias: ['Administración en Fisioterapia', 'Ética Profesional', 'Seminario de Tesis', 'Práctica Clínica III'] }
      ],
      expanded: false
    },
    {
      id: 'psicopedagogia',
      titulo: 'Psicopedagogía',
      descripcion: 'Generar la formación de profesionales de la Psicopedagogía con conocimientos sobre los procesos de enseñanza, aprendizaje y desarrollo humano',
      icono: 'brain',
      descripcionCompleta: 'Generar la formación de profesionales de la Psicopedagogía con conocimientos sobre los procesos de enseñanza, aprendizaje y desarrollo humano, con capacidad de reflexión y análisis que vinculen la teoría y el conocimiento obtenido bajo un enfoque pragmático.',
      queAprenderas: [
        'Psicología del aprendizaje',
        'Evaluación psicopedagógica',
        'Intervención en dificultades de aprendizaje',
        'Orientación educativa',
        'Neuropsicología educativa',
        'Diseño de programas de intervención'
      ],
      planEstudios: [
        { numero: 1, materias: ['Introducción a la Psicopedagogía', 'Psicología General', 'Desarrollo Humano', 'Neuroanatomía'] },
        { numero: 2, materias: ['Psicología Educativa', 'Teorías del Aprendizaje', 'Neuropsicología', 'Estadística'] },
        { numero: 3, materias: ['Evaluación Psicopedagógica', 'Dificultades del Aprendizaje', 'Desarrollo Cognitivo', 'Metodología de la Investigación'] },
        { numero: 4, materias: ['Intervención Psicopedagógica', 'Trastornos del Desarrollo', 'Orientación Educativa', 'Psicometría'] },
        { numero: 5, materias: ['Psicopedagogía Clínica', 'Necesidades Educativas Especiales', 'Familia y Educación', 'Práctica I'] },
        { numero: 6, materias: ['Psicopedagogía Institucional', 'Atención a la Diversidad', 'Asesoramiento Psicopedagógico', 'Práctica II'] },
        { numero: 7, materias: ['Diseño de Programas', 'Inclusión Educativa', 'Seminario de Tesis I', 'Práctica III'] },
        { numero: 8, materias: ['Psicopedagogía Laboral', 'Ética Profesional', 'Seminario de Tesis II', 'Práctica IV'] }
      ],
      expanded: false
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

  /**
   * Toggle del acordeón de carrera
   */
  toggleCarrera(carrera: Carrera): void {
    // Cerrar todas las demás carreras
    this.carreras.forEach(c => {
      if (c.id !== carrera.id) {
        c.expanded = false;
      }
    });
    
    // Toggle de la carrera seleccionada
    carrera.expanded = !carrera.expanded;
    
    // Scroll suave hacia la carrera expandida
    if (carrera.expanded) {
      setTimeout(() => {
        const element = document.getElementById(`carrera-${carrera.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }

  /**
   * Verificar si una carrera está expandida
   */
  isExpanded(carrera: Carrera): boolean {
    return carrera.expanded;
  }

  /**
   * Abrir modal de preinscripción
   */
  abrirModalPreinscripcion(): void {
    this.dialog.open(PreinscripcionModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'preinscripcion-modal',
      autoFocus: false,
      disableClose: false
    });
  }

  /**
   * Scroll suave a secciones
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}