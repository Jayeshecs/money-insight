import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  content: any;

  constructor(private contentService: ContentService) {
    this.content = this.contentService.getContent();
  }

  ngOnInit(): void {
    this.contentService.content$.subscribe(content => {
      this.content = content;
    });
  }
}
