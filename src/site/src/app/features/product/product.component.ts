import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/services/content.service';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, CtaButtonComponent],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit {
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
