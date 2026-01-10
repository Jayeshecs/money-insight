import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../core/services/content.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  content: any;
  formUrl: SafeResourceUrl;

  constructor(
    private contentService: ContentService,
    private sanitizer: DomSanitizer
  ) {
    this.content = this.contentService.getContent();
    this.formUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.content.contact.googleFormUrl + '?embedded=true');
  }

  ngOnInit(): void {
    this.contentService.content$.subscribe(content => {
      this.content = content;
      this.formUrl = this.sanitizer.bypassSecurityTrustResourceUrl(content.contact.googleFormUrl + '?embedded=true');
    });
  }
}
