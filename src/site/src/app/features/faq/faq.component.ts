import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent implements OnInit {
  content: any;
  openIndex: number | null = null;

  constructor(private contentService: ContentService) {
    this.content = this.contentService.getContent();
  }

  ngOnInit(): void {
    this.contentService.content$.subscribe(content => {
      this.content = content;
    });
  }

  toggleFaq(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}
